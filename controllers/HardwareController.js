const asyncHandler = require("express-async-handler");
const HardwareType = require("../models/HardwareType");

exports.create_hardware_get = asyncHandler(async function (req, res) {
	const allHardwareTypes = await HardwareType.find().exec();
	if (allHardwareTypes.length === 0) {
		throw new Error("Cannot create hardware without a hardware type");
	}
	res.render("add_hardware_form", {
		title: "Add Hardware",
		hardware_types: allHardwareTypes,
	});
});
