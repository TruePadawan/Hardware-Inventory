const { normalize } = require("node:path");

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
exports.isImage = async function (file) {
	const { default: imageType, minimumBytes } = await import("image-type");
	const { readChunk } = await import("read-chunk");

	const buffer = await readChunk(file.path, { length: minimumBytes });
	const fileIsImage = (await imageType(buffer)) !== false;
	return fileIsImage;
};
