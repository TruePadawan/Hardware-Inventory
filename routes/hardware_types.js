const router = require("express").Router();
const HardwareTypeController = require("../controllers/HardwareTypeController");

// GET list of hardware types
router.get("/", HardwareTypeController.get_hardware_types);

// GET request to create hardware type
router.get("/add", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware_types/add");
});

// POST request to create hardware type
router.post("/add", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware_types/add");
});

// GET request to show hardware type details
router.get("/:hardwareTypeID", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware_types/:hardwareTypeID");
});

// GET request to add hardware under a hardware type
router.get("/:hardwareTypeID/add_hardware", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware_types/:hardwareTypeID/add_hardware");
});

// POST request to add hardware under a hardware type
router.post("/:hardwareTypeID/add_hardware", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware_types/:hardwareTypeID/add_hardware");
});

// GET request to edit hardware type
router.get("/:hardwareTypeID/edit", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware_types/:hardwareTypeID/edit");
});

// POST request to edit hardware type
router.post("/:hardwareTypeID/edit", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware_types/:hardwareTypeID/edit");
});

// GET request to delete hardware type
router.get("/:hardwareTypeID/delete", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware_types/:hardwareTypeID/delete");
});

// POST request to delete hardware type
router.post("/:hardwareTypeID/delete", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware_types/:hardwareTypeID/delete");
});

module.exports = router;
