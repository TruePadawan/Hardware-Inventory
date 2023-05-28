const asyncHandler = require("express-async-handler");
const HardwareType = require("../models/HardwareType");
const {
	ADD_HARDWARE_PAGE,
	PUBLIC_DIR,
	createHardwareFormValidationChain,
	HARDWARE_DETAILS_PAGE,
} = require("../utilities/helpers.js");
const multer = require("multer");
const { validationResult } = require("express-validator");
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
			price,
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
