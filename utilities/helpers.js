const { normalize } = require("node:path");
const { body } = require("express-validator");
const HardwareType = require("../models/HardwareType");
const cloudinary = require("./cloudinary");
// Path to the /public/ directory
exports.PUBLIC_DIR = normalize(`${__dirname}/../public`);

// Names of template files
exports.INDEX_PAGE = "index";
exports.CREATE_HARDWARE_TYPE_PAGE = "create_hardware_type_form";
exports.HARDWARE_TYPE_DETAILS_PAGE = "hardware_type_details";
exports.EDIT_HARDWARE_TYPE_PAGE = "edit_hardware_type_form";
exports.DELETE_HARDWARE_TYPE_PAGE = "delete_hardware_type_form";
exports.ADD_HARDWARE_PAGE = "add_hardware_form";
exports.HARDWARE_DETAILS_PAGE = "hardware_details";
exports.EDIT_HARDWARE_PAGE = "edit_hardware_form";
exports.DELETE_HARDWARE_PAGE = "delete_hardware_form";

function deleteImageFromCloudinary(image_public_id) {
	return cloudinary.uploader.destroy(image_public_id, {
		invalidate: true,
	});
}

async function deleteImagesFromCloudinary(image_public_ids) {
	for (public_id of image_public_ids) {
		await deleteImageFromCloudinary(public_id);
	}
}

exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
exports.deleteImagesFromCloudinary = deleteImagesFromCloudinary;

// Given a file, isValidImage checks if the file is an image file and returns a boolean
async function isValidImage(image_data) {
	const validationData = { isValid: true, errorMessage: "" };
	const isImage = image_data.mimetype.split("/").at(0) === "image";
	const isLessThan1MB = image_data.size / 1000 < 1024;

	if (isImage === false) {
		validationData.isValid = false;
		validationData.errorMessage = "Selected file is not an Image";
	} else if (isLessThan1MB === false) {
		validationData.isValid = false;
		validationData.errorMessage = "Image must be less than 1MB";
	}
	return validationData;
}

function createImageValidationChain(field) {
	return body(field)
		.optional()
		.custom(async function (image_data) {
			const validationData = await isValidImage(image_data);
			if (validationData.isValid === false) {
				// Delete uploaded file if its not really an image.
				await deleteImageFromCloudinary(image_data.filename);
				throw new Error(validationData.errorMessage);
			}
		});
}

exports.createHardwareTypeFormValidationChain = function () {
	return [
		// Verify that uploaded file is an image and is less than 1MB using a custom validator
		createImageValidationChain("img_file"),
		body("name")
			.exists({ values: "falsy" })
			.withMessage("Name is required")
			.trim()
			.isLength({ min: 1 })
			.withMessage("Name must have at least one character")
			.isLength({ max: 40 })
			.withMessage("Name must not exceed 40 characters")
			.isString()
			.withMessage("Name must be a String")
			.escape(),
		body("desc", "Description is required")
			.exists({ values: "falsy" })
			.trim()
			.isLength({ min: 1 })
			.isString()
			.withMessage("Description must be a String")
			.escape(),
	];
};

exports.createHardwareFormValidationChain = function () {
	return [
		// Verify that uploaded file is an image and is less than 1MB using a custom validator
		createImageValidationChain("img_file"),
		body("name")
			.exists({ values: "falsy" })
			.withMessage("Name is required")
			.trim()
			.isLength({ min: 1 })
			.withMessage("Name must have at least one character")
			.isLength({ max: 100 })
			.withMessage("Name must not exceed 100 characters")
			.isString()
			.withMessage("Name must be a String")
			.escape(),
		// Use custom validator to check if id gotten from form matches any Hardware Type document's id
		body("hardware_type", "Hardware Type is not specified")
			.exists({ values: "falsy" })
			.custom(async function (id) {
				const count = await HardwareType.findById(id).countDocuments();
				if (count !== 1) {
					throw new Error("No Hardware Type associated with specified ID");
				}
			}),
		body("price", "Price is required")
			.exists({ values: "falsy" })
			.isFloat({ min: 0 })
			.withMessage("Price must be a number greater than 0"),
		body("number_in_stock", "Amount is required")
			.exists({ values: "falsy" })
			.isFloat({ min: 0 })
			.withMessage("Amount must be a number greater than 0"),
		body("desc", "Description is required")
			.exists({ values: "falsy" })
			.trim()
			.isLength({ min: 1 })
			.isString()
			.withMessage("Description must be a String")
			.escape(),
	];
};
