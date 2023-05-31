# ![Hardware-Inventory](https://hardware-inventory-production.up.railway.app/hardware_types)
![image](https://github.com/TruePadawan/Hardware-Inventory/assets/71678062/00ff92bb-cc11-40a8-82dc-d27b80aa5e95)
**Hardware Inventory** is a simple CRUD web-application I built to practice working with server-side technologies, NodeJS + ExpressJS to be exact.  
It's provides an interface for creating lists of hardwares which are group based on the type of hardware. My goal was mainly to get comfortable with Node and ExpressJS and how they work with other server-side tools.
## Stack
* **Node/ExpressJS** for the backend of the application.
* **MongoDB** for database.
* **Pug** as a template engines for creating the pages.
* **Express Validator** for user input validation.
* **Cloudinary** for storing and managing images uploaded by users.
## Setup
After cloning to your local environment, install the dependencies with the `npm install` command.
The application requires a couple of environment variables:
* `MONGODB_CONNECT_STR` - MongoDB database connection string.
* `ADMIN_PASSWORD` - A string that serves as a password for allowing editing and delete operations.
*  `CLOUDINARY_API_SECRET`, `CLOUDINARY_API_KEY` and `CLOUDINARY_CLOUD_NAME` - These are gotten from your Cloudinary console.  

Start the application with `npm run serverstart` which uses nodemon rather than node itself, Nodemon restarts the server if any changes are made to the code.
