const HardwareType = require("../models/HardwareType");

// Display all hardware categories
exports.get_hardware_types = function (req, res, next) {
	HardwareType.find({}, { desc: -1 })
		.exec()
		.then((allHardwareTypes) => {
			res.render("index", {
				title:
					allHardwareTypes.length > 0
						? "Hardware Types"
						: "Create Hardware Type",
				hardware_types: allHardwareTypes,
				show_home_button: false,
			});
		})
		.catch(next);
};

// Display form for creating hardware type
exports.create_hardware_type_get = function (req, res) {
	res.render("hardware_type_form", {
		title: "Create Hardware Type",
		show_home_button: true,
	});
};

// Handle POST request for creating hardware type
exports.create_hardware_type_post = function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware_types/new");
};
