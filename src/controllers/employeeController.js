const { getAllEmployee } = require("../services/employeeService");


async function getEmployees(req, res) {
    try {
        const employees = await getAllEmployee();
        res.status(200).json(employees);
    } catch (error) {
        console.error(`Error get employees: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getEmployees,
};