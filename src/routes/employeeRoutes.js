const express = require('express');
const employeeController = require('../controllers/employeeController');
const router = express.Router();

router.get('/get-employees', employeeController.getEmployees);

module.exports = router;