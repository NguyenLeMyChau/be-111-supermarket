const Account = require('../models/Account');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');

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

async function getAllCustomer() {
    try {
        const accounts = await Account.find({ role: 'customer' });

        const customers = await Promise.all(accounts.map(async (account) => {
            const customer = await Customer.findOne({ account_id: account._id });
            if (customer) {
                const customerObj = customer.toObject();
                customerObj.active = account.active;
                return customerObj;
            }
            return null;
        }));

        return customers.filter(customer => customer !== null);
    } catch (err) {
        throw new Error(`Error getting all customer: ${err.message}`);
    }
}

async function updateCustomer(customerId, customerData) {
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            throw new Error('customer not found');
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(customerId, customerData, { new: true });

        // Tìm Account liên quan đến Employee
        const account = await Account.findOne({ _id: customerData.account_id });
        if (account) {
            // Cập nhật trường phone trong Account
            account.phone = customerData.phone;
            await account.save();
        }

        return updatedCustomer;
    }
    catch (err) {
        throw new Error(`Error updating customer: ${err.message}`);
    }
}

async function getAllEmployeeAndManager() {
    try {
        const accounts = await Account.find({ role: { $in: ['staff', 'manager'] } });

        const employees = await Promise.all(accounts.map(async (account) => {
            const employee = await Employee.findOne({ account_id: account._id });
            if (employee) {
                const employeeObj = employee.toObject();
                employeeObj.active = account.active;
                employeeObj.role = account.role; // Thêm thông tin role vào đối tượng employee
                return employeeObj;
            }
            return null;
        }));

        return employees.filter(employee => employee !== null);
    } catch (err) {
        throw new Error(`Error getting all employees: ${err.message}`);
    }
}


module.exports = {
    getAllEmployee,
    updateEmployee,
    getAllCustomer,
    updateCustomer,
    getAllEmployeeAndManager
};