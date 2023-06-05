const asyncHandler = require("express-async-handler");
const HardwareType = require("../models/HardwareType");
const {
	ADD_HARDWARE_PAGE,
	createHardwareFormValidationChain,
	HARDWARE_DETAILS_PAGE,
	EDIT_HARDWARE_PAGE,
	DELETE_HARDWARE_PAGE,
	deleteImageFromCloudinary,
} = require("../utilities/helpers.js");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const Hardware = require("../models/Hardware");
const cloudinary = require("../utilities/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

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

const cloudinaryStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "hardware_inventory/hardwares",
		upload_preset: "hardwares",
	},
});
const upload = multer({ storage: cloudinaryStorage });
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
			img_url: img_file !== undefined ? img_file.path : undefined,
			img_public_id: img_file !== undefined ? img_file.filename : undefined,
		});

		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteImageFromCloudinary(img_file.filename);
			}
			res.render(ADD_HARDWARE_PAGE, {
				title: "Add Hardware",
				hardware,
				errors: errors.array(),
			});
		} else {
			await hardware.save();
			res.redirect(hardware.route_url);
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
			img_url: imageSelected ? img_file.path : undefined,
			img_public_id: imageSelected ? img_file.filename : undefined,
		});

		const errors = validationResult(req);
		if (errors.isEmpty() === false) {
			// Delete any uploaded image if any error occurs with form validation
			if (img_file) {
				await deleteImageFromCloudinary(img_file.filename);
			}

			// else re-render form with user input
			const allHardwareTypes = await HardwareType.find().exec();
			res.render(EDIT_HARDWARE_PAGE, {
				title: "Edit Hardware",
				hardware,
				hardware_types: allHardwareTypes,
				errors: errors.array(),
			});
		} else {
			// If no error and new image selected, delete former
			// Update hardware document after storing its former data in a variable
			const oldHardwareData = await Hardware.findById(
				req.params.hardwareID,
				"img_url img_public_id"
			).exec();
			await Hardware.findByIdAndUpdate(hardwareID, hardware).exec();
			const hasPreviousImage =
				imageSelected === true &&
				oldHardwareData.img_url !== undefined &&
				oldHardwareData.img_public_id !== undefined;

			if (hasPreviousImage) {
				await deleteImageFromCloudinary(oldHardwareData.img_public_id);
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
	const hardware = await Hardware.findById(hardwareID, "img_public_id img_url")
		.populate("hardware_type")
		.exec();
	if (hardware === null) {
		throw new Error("Hardware not found");
	} else {
		const hasImage =
			hardware.img_url !== undefined && hardware.img_public_id !== undefined;
		await Hardware.findByIdAndRemove(hardwareID).exec();

		// delete image if any
		if (hasImage) {
			await deleteImageFromCloudinary(hardware.img_public_id);
		}
		res.redirect(hardware.hardware_type.route_url);
	}
});
