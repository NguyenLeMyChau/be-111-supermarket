const Account = require('../models/Account');
const Employee = require('../models/Employee');

async function getAllEmployee() {
    try {
        const accounts = await Account.find({ role: 'staff' });

        const employees = await Promise.all(accounts.map(async (account) => {
            const employee = await Employee.findOne({ account_id: account._id });
            return employee ? employee.toObject() : null;
        }));

        return employees.filter(employee => employee !== null);
    } catch (err) {
        throw new Error(`Error getting all employees: ${err.message}`);
    }
}

module.exports = {
    getAllEmployee,
};