const HardwareType = require("../models/HardwareType");
const Hardware = require("../models/Hardware");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const mongoose = require("mongoose");
const {
	HARDWARE_TYPE_DETAILS_PAGE,
	CREATE_HARDWARE_TYPE_PAGE,
	INDEX_PAGE,
	EDIT_HARDWARE_TYPE_PAGE,
	DELETE_HARDWARE_TYPE_PAGE,
	createHardwareTypeFormValidationChain,
	deleteImageInCloudinary,
} = require("../utilities/helpers.js");
const cloudinary = require("../utilities/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Display all hardware categories
exports.get_hardware_types = asyncHandler(async function (req, res) {
	const allHardwareTypes = await HardwareType.find({}, "name img_url").exec();

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
const cloudinaryStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "hardware_inventory/hardware_types",
		upload_preset: "hardware_types",
	},
});
const upload = multer({ storage: cloudinaryStorage });
exports.create_hardware_type_post = [
	upload.single("img_file"),
	// Put the file in req.body so that express-validator can access it.
	function (req, res, next) {
		if (req.file !== undefined) {
			req.body.img_file = req.file;
			console.log(req.file);
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
			img_url: img_file !== undefined ? img_file.path : undefined,
			img_public_id: img_file !== undefined ? img_file.filename : undefined,
		});
		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteImageInCloudinary(img_file.filename);
			}

			res.render(CREATE_HARDWARE_TYPE_PAGE, {
				title: "Create Hardware Type",
				hardware_type: hardwareType,
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
			_id: hardwareTypeID,
			name,
			desc,
			img_url: imageSelected ? img_file.path : undefined,
			img_public_id: imageSelected ? img_file.filename : undefined,
		});
		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteImageInCloudinary(img_file.filename);
			}

			res.render(EDIT_HARDWARE_TYPE_PAGE, {
				title: "Edit Hardware Type",
				hardware_type: hardwareType,
				errors: errors.array(),
			});
		} else {
			// If no error with form data and update query, and if document has former image, Delete the now unused image
			// Update hardware type document after storing its former data in a variable
			const oldHardwareTypeData = await HardwareType.findById(
				hardwareTypeID,
				"img_url img_public_id"
			).exec();
			await HardwareType.findByIdAndUpdate(hardwareTypeID, hardwareType).exec();

			const hasPreviousImage =
				imageSelected === true &&
				oldHardwareTypeData.img_url !== undefined &&
				oldHardwareTypeData.img_public_id !== undefined;

			if (hasPreviousImage) {
				await deleteImageInCloudinary(oldHardwareTypeData.img_public_id);
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
		let imgPublicID = "";

		await session.withTransaction(async () => {
			await Hardware.deleteMany(
				{ hardware_type: hardwareTypeID },
				{ session }
			).exec();

			// Store hardware_type image data for deletion after transaction is successful
			const hardwareType = await HardwareType.findById(
				hardwareTypeID,
				"img_public_id img_url"
			).exec();
			if (hardwareType === null) {
				throw new Error("Hardware Type not found");
			}
			hasImage =
				hardwareType.img_url !== undefined &&
				hardwareType.img_public_id !== undefined;
			imgPublicID = hardwareType.img_public_id;
			await HardwareType.findByIdAndRemove(hardwareTypeID, { session }).exec();
		});

		await session.commitTransaction();
		await session.endSession();
		// Transaction completes with no error, delete image for the now deleted hardware_type
		if (hasImage) {
			await deleteImageInCloudinary(imgPublicID);
		}
		res.redirect("/");
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		throw error;
	}
});
