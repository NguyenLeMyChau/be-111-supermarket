const { getAllEmployee, updateEmployee } = require("../services/employeeService");


async function getEmployees(req, res) {
    try {
        const employees = await getAllEmployee();
        res.status(200).json(employees);
    } catch (error) {
        console.error(`Error get employees: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function updateEmployeeController(req, res) {
    try {
        const { employeeId } = req.params;
        const employeeData = req.body;
        const updatedEmployee = await updateEmployee(employeeId, employeeData);
        res.status(200).json(updatedEmployee);
    } catch (error) {
        console.error(`Error update employee: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getEmployees,
    updateEmployeeController,
};