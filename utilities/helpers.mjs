import { readChunk } from "read-chunk";
import imageType, { minimumBytes } from "image-type";
import { fileURLToPath } from "node:url";
import { dirname, normalize } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the /public/ directory
export const PUBLIC_DIR = normalize(`${__dirname}/../public`);

// Given a file, isImage checks if the file is an image file and returns a boolean
export async function isImage(file) {
	const buffer = await readChunk(file.path, { length: minimumBytes });
	const fileIsImage = (await imageType(buffer)) !== false;
	return fileIsImage;
}
