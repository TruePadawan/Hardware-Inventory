const router = require("express").Router();
const HardwareController = require("../controllers/HardwareController");

router.get("/", function (req, res) {
	res.redirect("/hardware_types");
});

// GET request to add hardware under a hardware type
router.get("/new", HardwareController.create_hardware_get);

// POST request to add hardware under a hardware type
router.post("/new", HardwareController.create_hardware_post);

// GET request to show hardware details
router.get("/:hardwareID", HardwareController.get_hardware_details);

// GET request to delete hardware
router.get("/:hardwareID/delete", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware/:hardwareID/delete");
});

// POST request to delete hardware
router.post("/:hardwareID/delete", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware/:hardwareID/delete");
});

// GET request to edit hardware
router.get("/:hardwareID/edit", HardwareController.edit_hardware_get);

// POST request to edit hardware
router.post("/:hardwareID/edit", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware/:hardwareID/edit");
});

module.exports = router;
