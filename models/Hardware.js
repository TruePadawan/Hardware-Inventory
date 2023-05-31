const mongoose = require("mongoose");

const HardwareSchema = new mongoose.Schema({
	name: { required: true, type: String, maxLength: 100 },
	desc: { required: true, type: String },
	img_url: String,
	img_public_id: String,
	price_usd: { type: Number, required: true, default: 0 },
	hardware_type: {
		required: true,
		ref: "HardwareType",
		type: mongoose.Schema.Types.ObjectId,
	},
	number_in_stock: { type: Number, required: true, default: 0 },
});

HardwareSchema.virtual("route_url").get(function () {
	return `/hardware/${this._id}`;
});

module.exports = mongoose.model("Hardware", HardwareSchema);
