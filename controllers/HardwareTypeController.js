const HardwareType = require("../models/HardwareType");

exports.get_hardware_types = function (req, res, next) {
	HardwareType.find({}, { desc: -1 })
		.exec()
		.then((allHardwareTypes) => {
			res.render("index", {
				title: "Hardware Types",
				hardware_types: allHardwareTypes,
				show_home_button: false,
			});
		})
		.catch(next);
};

// exports.create_hardware_type_get = function (req, res) {};
