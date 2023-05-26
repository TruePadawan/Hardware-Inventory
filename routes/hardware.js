const router = require("express").Router();

router.get("/", function (req, res) {
	res.redirect("/hardware_types");
});

// GET request to show hardware details
router.get("/:hardwareID", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware");
});

// GET request to add hardware under a hardware type
router.get("/new", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware/new");
});

// POST request to add hardware under a hardware type
router.post("/new", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware/new");
});

// GET request to delete hardware
router.get("/:hardwareID/delete", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware/:hardwareID/delete");
});

// POST request to delete hardware
router.post("/:hardwareID/delete", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware/:hardwareID/delete");
});

// GET request to edit hardware
router.get("/:hardwareID/edit", function (req, res) {
	res.send("ROUTE NOT SET: GET /hardware/:hardwareID/edit");
});

// POST request to edit hardware
router.post("/:hardwareID/edit", function (req, res) {
	res.send("ROUTE NOT SET: POST /hardware/:hardwareID/edit");
});

module.exports = router;
