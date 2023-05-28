const asyncHandler = require("express-async-handler");
const HardwareType = require("../models/HardwareType");
const {
	ADD_HARDWARE_PAGE,
	PUBLIC_DIR,
	createHardwareFormValidationChain,
	HARDWARE_DETAILS_PAGE,
	EDIT_HARDWARE_PAGE,
	DELETE_HARDWARE_PAGE,
} = require("../utilities/helpers.js");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Hardware = require("../models/Hardware");
const { unlink: deleteFile } = require("node:fs/promises");

const upload = multer({ dest: `${PUBLIC_DIR}/images/hardware` });

exports.create_hardware_get = asyncHandler(async function (req, res) {
	const allHardwareTypes = await HardwareType.find().exec();
	if (allHardwareTypes.length === 0) {
		throw new Error("Cannot create hardware without a hardware type");
	}
	res.render(ADD_HARDWARE_PAGE, {
		title: "Add Hardware",
		hardware_types: allHardwareTypes,
	});
});

exports.create_hardware_post = [
	upload.single("img_file"),
	// Put the file in req.body so that express-validator can access it.
	function (req, res, next) {
		if (req.file !== undefined) {
			req.body.img_file = req.file;
		}
		next();
	},
	...createHardwareFormValidationChain(),
	asyncHandler(async function (req, res) {
		const errors = validationResult(req);
		const { name, hardware_type, price, number_in_stock, desc, img_file } =
			req.body;
		const hardware = new Hardware({
			name,
			hardware_type,
			price_usd: price,
			number_in_stock,
			desc,
			img_filename: img_file !== undefined ? img_file.filename : undefined,
		});

		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteFile(img_file.path);
			}
			res.render(ADD_HARDWARE_PAGE, {
				title: "Add Hardware",
				errors: errors.array(),
				hardware,
			});
		} else {
			await hardware.save();
			const hardwareType = await HardwareType.findById(hardware_type).exec();
			res.redirect(hardwareType.route_url);
		}
	}),
];

exports.get_hardware_details = asyncHandler(async function (req, res) {
	const hardware = await Hardware.findById(req.params.hardwareID)
		.populate("hardware_type")
		.exec();
	if (hardware === null) {
		throw new Error("Hardware not found");
	}
	res.render(HARDWARE_DETAILS_PAGE, {
		title: hardware.name,
		show_home_button: true,
		hardware,
	});
});

exports.edit_hardware_get = asyncHandler(async function (req, res) {
	const [allHardwareTypes, hardware] = await Promise.all([
		HardwareType.find().exec(),
		Hardware.findById(req.params.hardwareID).exec(),
	]);

	if (allHardwareTypes.length === 0) {
		throw new Error("No hardware type");
	}
	if (hardware === null) {
		throw new Error("Hardware data not found");
	}

	res.render(EDIT_HARDWARE_PAGE, {
		title: "Edit Hardware",
		hardware,
		hardware_types: allHardwareTypes,
	});
});

exports.edit_hardware_post = [
	upload.single("img_file"),
	// Put the file in req.body so that express-validator can access it.
	function (req, res, next) {
		if (req.file !== undefined) {
			req.body.img_file = req.file;
		}
		next();
	},
	...createHardwareFormValidationChain(),
	body("password", "Password is wrong!").equals(process.env.ADMIN_PASSWORD),
	asyncHandler(async function (req, res) {
		const { name, hardware_type, price, number_in_stock, desc, img_file } =
			req.body;
		const imageSelected = img_file !== undefined;
		const { hardwareID } = req.params;
		const hardware = new Hardware({
			_id: hardwareID,
			name,
			hardware_type,
			price_usd: price,
			number_in_stock,
			desc,
			img_filename: imageSelected ? img_file.filename : undefined,
		});

		const errors = validationResult(req);
		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteFile(img_file.path);
			}

			// else re-render form with user input
			const allHardwareTypes = await HardwareType.find().exec();
			res.render(EDIT_HARDWARE_PAGE, {
				title: "Add Hardware",
				errors: errors.array(),
				hardware,
				hardware_types: allHardwareTypes,
			});
		} else {
			// If no error and new image selected, delete former
			// Update hardware document after storing its former data in a variable
			const oldHardwareData = await Hardware.findById(
				req.params.hardwareID,
				"img_filename"
			).exec();
			await Hardware.findByIdAndUpdate(hardwareID, hardware).exec();
			const hasPreviousImage =
				imageSelected === true && oldHardwareData.img_filename !== undefined;
			if (hasPreviousImage) {
				const oldImgFilePath = `${PUBLIC_DIR}${oldHardwareData.image_url}`;
				await deleteFile(oldImgFilePath);
			}
			res.redirect(hardware.route_url);
		}
	}),
];

exports.delete_hardware_get = asyncHandler(async function (req, res) {
	const hardware = await Hardware.findById(req.params.hardwareID).exec();
	if (hardware === null) {
		throw new Error("Hardware with specified ID not found");
	}
	res.render(DELETE_HARDWARE_PAGE, { title: "Delete Hardware Type", hardware });
});

exports.delete_hardware_post = asyncHandler(async function (req, res) {
	const { hardwareID } = req.params;
	const hardware = await Hardware.findById(hardwareID, "img_filename")
		.populate("hardware_type")
		.exec();
	if (hardware === null) {
		throw new Error("Hardware not found");
	} else {
		const hasImage = hardware.img_filename !== undefined;
		const imgFilePath = `${PUBLIC_DIR}${hardware.image_url}`;
		await Hardware.findByIdAndRemove(hardwareID).exec();

		// delete image if any
		if (hasImage) {
			await deleteFile(imgFilePath);
		}
		res.redirect(hardware.hardware_type.route_url);
	}
});
