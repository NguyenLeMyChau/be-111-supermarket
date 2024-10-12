const express = require('express');
const employeeController = require('../controllers/employeeController');
const router = express.Router();

router.get('/get-employees', employeeController.getEmployees);
router.put('/update-employee/:employeeId', employeeController.updateEmployeeController);

module.exports = router;