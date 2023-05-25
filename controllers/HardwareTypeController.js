const HardwareType = require("../models/HardwareType");
const Hardware = require("../models/Hardware");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const path = require("node:path");
const multer = require("multer");
const { unlink } = require("node:fs/promises");

const PUBLIC_DIR = path.normalize(`${__dirname}/../public`);
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

	res.render("index", {
		title:
			allHardwareTypes.length > 0 ? "Hardware Types" : "Create Hardware Type",
		hardware_types: allHardwareTypes,
		show_home_button: false,
	});
});

// Display form for creating hardware type
exports.create_hardware_type_get = function (req, res) {
	res.render("hardware_type_form", {
		title: "Create Hardware Type",
		show_home_button: true,
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
	// Verify that uploaded file is really an image using a custom validator
	body("img_file")
		.optional()
		.custom(async function (file) {
			const { default: imageType, minimumBytes } = await import("image-type");
			const { readChunk } = await import("read-chunk");
			const buffer = await readChunk(file.path, { length: minimumBytes });
			const isImage = (await imageType(buffer)) !== false;
			if (isImage === false) {
				// Delete uploaded file if its not really an image.
				await unlink(file.path);
				throw new Error("Selected file is not an Image");
			} else {
				if (file.size / 1000 > 1024) {
					await unlink(file.path);
					throw new Error("Image must be less than 1MB");
				}
			}
		}),
	// prettier-ignore
	body("name")
		.exists({ values: "falsy" })
		.withMessage("Name is required")
		.trim()
		.isLength({ min: 1, max: 40 })
		.withMessage("Name must not exceed 40 characters")
		// Formatting removes the slash, the prettier-ignore above prevents that
		.isAlphanumeric("en-GB", { ignore: "\s" })
		.withMessage("Name must be alphanumeric")
		.escape(),
	body("desc", "Description is required")
		.exists({ values: "falsy" })
		.trim()
		.isLength({ min: 1 })
		.escape(),
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
				await unlink(img_file.path);
			}

			res.render("hardware_type_form", {
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
	if (hardwareType) {
		res.render("hardware_type_details", {
			title: hardwareType.name,
			show_home_button: true,
			hardware_type: hardwareType,
			hardwares,
		});
	} else {
		throw new Error("Hardware Type not found!");
	}
});

exports.edit_hardware_type_get = asyncHandler(async function (req, res) {
	const { hardwareTypeID } = req.params;
	const hardwareType = await HardwareType.findById(
		hardwareTypeID,
		"name desc"
	).exec();

	if (hardwareType) {
		res.render("edit_hardware_type_form", {
			title: "Edit Hardware Type",
			hardware_type: hardwareType,
		});
	} else {
		throw new Error("Hardware Type not found!");
	}
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

	// Verify that uploaded file is really an image using a custom validator
	body("img_file")
		.optional()
		.custom(async function (file) {
			const { default: imageType, minimumBytes } = await import("image-type");
			const { readChunk } = await import("read-chunk");
			const buffer = await readChunk(file.path, { length: minimumBytes });
			const isImage = (await imageType(buffer)) !== false;
			if (isImage === false) {
				// Delete uploaded file if its not really an image.
				await unlink(file.path);
				throw new Error("Selected file is not an Image");
			} else {
				if (file.size / 1000 > 1024) {
					await unlink(file.path);
					throw new Error("Image must be less than 1MB");
				}
			}
		}),
	// prettier-ignore
	body("name")
		.exists({ values: "falsy" })
		.withMessage("Name is required")
		.trim()
		.isLength({ min: 1, max: 40 })
		.withMessage("Name must not exceed 40 characters")
		// Formatting removes the slash, the prettier-ignore above prevents that
		.isAlphanumeric("en-GB", { ignore: "\s" })
		.withMessage("Name must be alphanumeric")
		.escape(),
	body("desc", "Description is required")
		.exists({ values: "falsy" })
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("password", "Password is wrong!")
		.escape()
		.equals(process.env.ADMIN_PASSWORD),

	asyncHandler(async function (req, res) {
		const errors = validationResult(req);
		const { name, desc, img_file } = req.body;

		const { hardwareTypeID } = req.params;
		const imageSelected = img_file !== undefined;
		req.body.imageSelected = imageSelected;

		const hardwareType = new HardwareType({
			name,
			desc,
			img_filename: imageSelected ? img_file.filename : undefined,
			_id: hardwareTypeID,
		});
		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await unlink(img_file.path);
			}

			res.render("edit_hardware_type_form", {
				title: "Edit Hardware Type",
				hardware_type: hardwareType,
				errors: errors.array(),
			});
		} else {
			// If no error with form data and update query, and document has former image, Delete the now unused image file from disk
			const oldHardwareType = await HardwareType.findById(
				hardwareTypeID,
				"img_filename"
			).exec();
			// Update hardware type document after storing its former data in a variable
			await HardwareType.findByIdAndUpdate(hardwareTypeID, hardwareType).exec();

			const hasPreviousImage =
				imageSelected === true && oldHardwareType.img_filename !== undefined;
			if (hasPreviousImage) {
				const oldImgFilePath = `${PUBLIC_DIR}${oldHardwareType.image_url}`;
				await unlink(oldImgFilePath);
			}
			res.redirect(hardwareType.route_url);
		}
	}),
];
