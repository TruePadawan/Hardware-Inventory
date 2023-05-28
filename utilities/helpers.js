const { normalize } = require("node:path");
const { body } = require("express-validator");
const { unlink: deleteFile } = require("node:fs/promises");
const HardwareType = require("../models/HardwareType");
// Path to the /public/ directory
exports.PUBLIC_DIR = normalize(`${__dirname}/../public`);

// Names of template files
exports.INDEX_PAGE = "index";
exports.CREATE_HARDWARE_TYPE_PAGE = "create_hardware_type_form";
exports.HARDWARE_TYPE_DETAILS_PAGE = "hardware_type_details";
exports.EDIT_HARDWARE_TYPE_PAGE = "edit_hardware_type_form";
exports.DELETE_HARDWARE_TYPE_PAGE = "delete_hardware_type_form";
exports.ADD_HARDWARE_PAGE = "add_hardware_form";

// Given a file, isImage checks if the file is an image file and returns a boolean
async function isImage(file) {
	const { default: imageType, minimumBytes } = await import("image-type");
	const { readChunk } = await import("read-chunk");

	const buffer = await readChunk(file.path, { length: minimumBytes });
	const fileIsImage = (await imageType(buffer)) !== false;
	return fileIsImage;
}
exports.isImage = isImage;

exports.createHardwareTypeFormValidationChain = function () {
	return [
		// Verify that uploaded file is really an image using a custom validator
		body("img_file")
			.optional()
			.custom(async function (file) {
				const fileIsImage = await isImage(file);
				if (fileIsImage === false) {
					// Delete uploaded file if its not really an image.
					await deleteFile(file.path);
					throw new Error("Selected file is not an Image");
				} else {
					if (file.size / 1000 > 1024) {
						await deleteFile(file.path);
						throw new Error("Image must be less than 1MB");
					}
				}
			}),
		// prettier-ignore
		body("name")
			.exists({ values: "falsy" })
			.withMessage("Name is required")
			.trim()
			.isLength({ min: 1 })
			.withMessage("Name must have at least one character")
			.isLength({ max: 40 })
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
	];
};

exports.createHardwareFormValidationChain = function () {
	return [
		// Verify that uploaded file is really an image using a custom validator
		body("img_file")
			.optional()
			.custom(async function (file) {
				const fileIsImage = await isImage(file);
				if (fileIsImage === false) {
					// Delete uploaded file if its not really an image.
					await deleteFile(file.path);
					throw new Error("Selected file is not an Image");
				} else {
					if (file.size / 1000 > 1024) {
						await deleteFile(file.path);
						throw new Error("Image must be less than 1MB");
					}
				}
			}),
		// prettier-ignore
		body("name")
			.exists({ values: "falsy" })
			.withMessage("Name is required")
			.trim()
			.isLength({ min: 1 })
			.withMessage("Name must have at least one character")
			.isLength({ max: 40 })
			.withMessage("Name must not exceed 40 characters")
			// Formatting removes the slash, the prettier-ignore above prevents that
			.isAlphanumeric("en-GB", { ignore: "\s" })
			.withMessage("Name must be alphanumeric")
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
			.isNumeric()
			.withMessage("Price must be a number"),
		body("number_in_stock", "Amount is required")
			.exists({ values: "falsy" })
			.isNumeric()
			.withMessage("Amount must be a number"),
		body("desc", "Description is required")
			.exists({ values: "falsy" })
			.trim()
			.isLength({ min: 1 })
			.escape(),
	];
};
