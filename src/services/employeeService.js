const Account = require('../models/Account');
const Employee = require('../models/Employee');

async function getAllEmployee() {
    try {
        const accounts = await Account.find({ role: 'staff' });

        const employees = await Promise.all(accounts.map(async (account) => {
            const employee = await Employee.findOne({ account_id: account._id });
            if (employee) {
                const employeeObj = employee.toObject();
                employeeObj.active = account.active;
                return employeeObj;
            }
            return null;
        }));

        return employees.filter(employee => employee !== null);
    } catch (err) {
        throw new Error(`Error getting all employees: ${err.message}`);
    }
}

async function updateEmployee(employeeId, employeeData) {
    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, employeeData, { new: true });

        // Tìm Account liên quan đến Employee
        const account = await Account.findOne({ _id: employeeData.account_id });
        if (account) {
            // Cập nhật trường phone trong Account
            account.phone = employeeData.phone;
            account.active = employeeData.active;
            await account.save();
        }

        return updatedEmployee;
    }
    catch (err) {
        throw new Error(`Error updating employee: ${err.message}`);
    }
}

module.exports = {
    getAllEmployee,
    updateEmployee,
};