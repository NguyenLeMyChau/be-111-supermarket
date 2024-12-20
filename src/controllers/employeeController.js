const { getAllEmployee, updateEmployee, getAllCustomer, updateCustomer, getAllEmployeeAndManager } = require("../services/employeeService");


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

const getAllCustomerController = async (req, res) => {
    try {
        const customers = await getAllCustomer();
        res.status(200).json(customers);
    } catch (error) {
        console.error(`Error get customers: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function updateCustomerController(req, res) {
    try {
        const { customerId } = req.params;
        const customerData = req.body;
        const updatedCustomer = await updateCustomer(customerId, customerData);
        res.status(200).json(updatedCustomer);
    } catch (error) {
        console.error(`Error update customer: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getAllEmployeeAndManagerController(req, res) {
    try {
        const employeeAndManager = await getAllEmployeeAndManager();
        res.status(200).json(employeeAndManager);
    } catch (error) {
        console.error(`Error get getAllEmployeeAndManager: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getEmployees,
    updateEmployeeController,
    getAllCustomerController,
    updateCustomerController,
    getAllEmployeeAndManagerController
};