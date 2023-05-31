const mongoose = require("mongoose");

const HardwareTypeSchema = new mongoose.Schema({
	name: { required: true, type: String, maxLength: 40 },
	desc: { required: true, type: String },
	img_url: String,
	img_public_id: String,
});

HardwareTypeSchema.virtual("route_url").get(function () {
	return `/hardware_types/${this._id}`;
});

module.exports = mongoose.model("HardwareType", HardwareTypeSchema);
