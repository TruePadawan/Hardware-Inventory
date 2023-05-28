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
router.get("/:hardwareID/delete", HardwareController.delete_hardware_get);

// POST request to delete hardware
router.post("/:hardwareID/delete", HardwareController.delete_hardware_post);

// GET request to edit hardware
router.get("/:hardwareID/edit", HardwareController.edit_hardware_get);

// POST request to edit hardware
router.post("/:hardwareID/edit", HardwareController.edit_hardware_post);

module.exports = router;
