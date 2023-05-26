const router = require("express").Router();
const HardwareTypeController = require("../controllers/HardwareTypeController");

// GET list of hardware types
router.get("/", HardwareTypeController.get_hardware_types);

// GET request to create hardware type
router.get("/new", HardwareTypeController.create_hardware_type_get);

// POST request to create hardware type
router.post("/new", HardwareTypeController.create_hardware_type_post);

// GET request to show hardware type details
router.get("/:hardwareTypeID", HardwareTypeController.get_hardware_details);

// GET request to edit hardware type
router.get(
	"/:hardwareTypeID/edit",
	HardwareTypeController.edit_hardware_type_get
);

// POST request to edit hardware type
router.post(
	"/:hardwareTypeID/edit",
	HardwareTypeController.edit_hardware_type_post
);

// GET request to delete hardware type
router.get(
	"/:hardwareTypeID/delete",
	HardwareTypeController.delete_hardware_type_get
);

// POST request to delete hardware type
router.post(
	"/:hardwareTypeID/delete",
	HardwareTypeController.delete_hardware_type_post
);

module.exports = router;
