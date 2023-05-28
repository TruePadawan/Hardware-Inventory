const HardwareType = require("../models/HardwareType");
const Hardware = require("../models/Hardware");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const { unlink: deleteFile } = require("node:fs/promises");
const mongoose = require("mongoose");
const {
	PUBLIC_DIR,
	HARDWARE_TYPE_DETAILS_PAGE,
	CREATE_HARDWARE_TYPE_PAGE,
	INDEX_PAGE,
	EDIT_HARDWARE_TYPE_PAGE,
	DELETE_HARDWARE_TYPE_PAGE,
	createHardwareTypeFormValidationChain,
} = require("../utilities/helpers.js");

const upload = multer({ dest: `${PUBLIC_DIR}/images/hardware_types` });

/* HANDLING POST REQUESTS FROM FORMS
	For POST requests from forms, the user supplied data is sanitized and validated.
	If any error with the data
		re-render form with supplied data and show errors
	else
		continue
	If image file is part of form data,
	process image only after other form data is validated to be correct
*/

// Display all hardware categories
exports.get_hardware_types = asyncHandler(async function (req, res) {
	const allHardwareTypes = await HardwareType.find(
		{},
		"name img_filename"
	).exec();

	res.render(INDEX_PAGE, {
		title:
			allHardwareTypes.length > 0 ? "Hardware Types" : "Create Hardware Type",
		hardware_types: allHardwareTypes,
	});
});

// Display form for creating hardware type
exports.create_hardware_type_get = function (req, res) {
	res.render(CREATE_HARDWARE_TYPE_PAGE, {
		title: "Create Hardware Type",
	});
};

// Handle POST request for creating hardware type
/*
	Name is not optional and must be <= 40 characters long
	Description is not optional
	Image File if provided should be processed and validated that it's an actual image,
	it should be < 1MB
*/
/* Handling Image upload
	After multer uploads file
	Confirm selected file is really an image
	If yes
		If other fields validate correctly
			successfully create HardwareType document
		else
			re-render form with errors provided
	else
		delete uploaded file, validate other fields and re-render form with errors gotten
*/
exports.create_hardware_type_post = [
	upload.single("img_file"),
	// Put the file in req.body so that express-validator can access it.
	function (req, res, next) {
		if (req.file !== undefined) {
			req.body.img_file = req.file;
		}
		next();
	},
	// Validate form fields
	...createHardwareTypeFormValidationChain(),
	asyncHandler(async function (req, res) {
		const errors = validationResult(req);
		const { name, desc, img_file } = req.body;
		const hardwareType = new HardwareType({
			name,
			desc,
			img_filename: img_file !== undefined ? img_file.filename : undefined,
		});
		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteFile(img_file.path);
			}

			res.render(CREATE_HARDWARE_TYPE_PAGE, {
				title: "Create Hardware Type",
				hardware_type: hardwareType,
				show_home_button: true,
				errors: errors.array(),
			});
		} else {
			await hardwareType.save();
			res.redirect(hardwareType.route_url);
		}
	}),
];

exports.get_hardware_details = asyncHandler(async function (req, res, next) {
	const { hardwareTypeID } = req.params;
	const [hardwareType, hardwares] = await Promise.all([
		HardwareType.findById(hardwareTypeID).exec(),
		Hardware.find({ hardware_type: hardwareTypeID }).exec(),
	]);
	if (hardwareType === null) {
		throw new Error("Hardware Type not found!");
	}
	res.render(HARDWARE_TYPE_DETAILS_PAGE, {
		title: hardwareType.name,
		show_home_button: true,
		hardware_type: hardwareType,
		hardwares,
	});
});

exports.edit_hardware_type_get = asyncHandler(async function (req, res) {
	const { hardwareTypeID } = req.params;
	const hardwareType = await HardwareType.findById(
		hardwareTypeID,
		"name desc"
	).exec();

	if (hardwareType === null) {
		throw new Error("Hardware Type not found!");
	}
	res.render(EDIT_HARDWARE_TYPE_PAGE, {
		title: "Edit Hardware Type",
		hardware_type: hardwareType,
	});
});

/*
	If hardware_type document has image and new image is selected and validated
		delete the former image after updating document
*/
exports.edit_hardware_type_post = [
	upload.single("img_file"),
	// Put the file in req.body so that express-validator can access it.
	function (req, res, next) {
		if (req.file !== undefined) {
			req.body.img_file = req.file;
		}
		next();
	},
	// Validate form fields
	...createHardwareTypeFormValidationChain(),
	body("password", "Password is wrong!").equals(process.env.ADMIN_PASSWORD),
	asyncHandler(async function (req, res) {
		const errors = validationResult(req);
		const { name, desc, img_file } = req.body;

		const { hardwareTypeID } = req.params;
		const imageSelected = img_file !== undefined;

		const hardwareType = new HardwareType({
			name,
			desc,
			img_filename: imageSelected ? img_file.filename : undefined,
			_id: hardwareTypeID,
		});
		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteFile(img_file.path);
			}

			res.render(EDIT_HARDWARE_TYPE_PAGE, {
				title: "Edit Hardware Type",
				hardware_type: hardwareType,
				errors: errors.array(),
			});
		} else {
			// If no error with form data and update query, and if document has former image, Delete the now unused image file from disk
			// Update hardware type document after storing its former data in a variable
			const oldHardwareTypeData = await HardwareType.findById(
				hardwareTypeID,
				"img_filename"
			).exec();
			await HardwareType.findByIdAndUpdate(hardwareTypeID, hardwareType).exec();

			const hasPreviousImage =
				imageSelected === true &&
				oldHardwareTypeData.img_filename !== undefined;
			if (hasPreviousImage) {
				const oldImgFilePath = `${PUBLIC_DIR}${oldHardwareTypeData.image_url}`;
				await deleteFile(oldImgFilePath);
			}
			res.redirect(hardwareType.route_url);
		}
	}),
];

exports.delete_hardware_type_get = asyncHandler(async function (req, res) {
	const hardwareType = await HardwareType.findById(
		req.params.hardwareTypeID
	).exec();
	if (hardwareType === null) {
		throw new Error("Can't find any Hardware Type with the specified ID");
	}
	res.render(DELETE_HARDWARE_TYPE_PAGE, {
		title: "Delete Hardware Type",
		hardware_type: hardwareType,
	});
});

// Setup a transaction that deletes all hardware under the hardware_type before deleting the hardware type and image if any
exports.delete_hardware_type_post = asyncHandler(async function (req, res) {
	const { hardwareTypeID } = req.params;
	const session = await mongoose.startSession();

	try {
		let hasImage = false;
		let imgFilePath = "";

		await session.withTransaction(async () => {
			await Hardware.deleteMany(
				{ hardware_type: hardwareTypeID },
				{ session }
			).exec();

			// Store hardware_type image data for deletion after transaction is successful
			const hardwareType = await HardwareType.findById(
				hardwareTypeID,
				"img_filename"
			).exec();
			if (hardwareType === null) {
				throw new Error("Hardware Type not found");
			}
			hasImage = hardwareType.img_filename !== undefined;
			imgFilePath = `${PUBLIC_DIR}${hardwareType.image_url}`;
			await HardwareType.findByIdAndRemove(hardwareTypeID, { session }).exec();
		});

		await session.commitTransaction();
		await session.endSession();
		// Transaction completes with no error, delete image for the now deleted hardware_type
		// TODO: Delete images from hardwares
		if (hasImage) {
			await deleteFile(imgFilePath);
		}
		res.redirect("/");
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		throw error;
	}
});
