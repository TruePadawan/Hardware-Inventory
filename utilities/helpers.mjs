import { readChunk } from "read-chunk";
import imageType, { minimumBytes } from "image-type";
import { fileURLToPath } from "node:url";
import { dirname, normalize } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the /public/ directory
export const PUBLIC_DIR = normalize(`${__dirname}/../public`);

// Names of template files
export const INDEX_PAGE = "index";
export const CREATE_HARDWARE_TYPE_PAGE = "create_hardware_type_form";
export const HARDWARE_TYPE_DETAILS_PAGE = "hardware_type_details";
export const EDIT_HARDWARE_TYPE_PAGE = "edit_hardware_type_form";
export const DELETE_HARDWARE_TYPE_PAGE = "delete_hardware_type_form";
export const ADD_HARDWARE_PAGE = "add_hardware_form";

// Given a file, isImage checks if the file is an image file and returns a boolean
export async function isImage(file) {
	const buffer = await readChunk(file.path, { length: minimumBytes });
	const fileIsImage = (await imageType(buffer)) !== false;
	return fileIsImage;
}
