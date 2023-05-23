const mongoose = require("mongoose");

const HardwareTypeSchema = new mongoose.Schema({
	name: { required: true, type: String, maxLength: 40 },
	desc: { required: true, type: String },
	img_filename: String,
});

HardwareTypeSchema.virtual("route_url").get(function () {
	return `/hardware_types/${this._id}`;
});

HardwareTypeSchema.virtual("image_url").get(function () {
	return `/images/hardware_types/${this.img_filename}`;
});

module.exports = mongoose.model("HardwareType", HardwareTypeSchema);
