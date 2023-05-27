import { readChunk } from "read-chunk";
import imageType, { minimumBytes } from "image-type";

// Given a file, isImage checks if the file is an image file and returns a boolean
export async function isImage(file) {
	const buffer = await readChunk(file.path, { length: minimumBytes });
	const fileIsImage = (await imageType(buffer)) !== false;
	return fileIsImage;
}
