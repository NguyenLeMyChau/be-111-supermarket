const Account = require('../models/Account');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');

const updateUser = async (accountId, userData) => {
    try {
        const account = await Account.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Cập nhật trường phone trong Account
        if (userData.phone) {
            account.phone = userData.phone;
            await account.save();
        }

        let userUpdated;
        if (account.role === 'customer') {
            userUpdated = await Customer.findOneAndUpdate({ account_id: accountId }, userData, { new: true });
        } else {
            userUpdated = await Employee.findOneAndUpdate({ account_id: accountId }, userData, { new: true });
        }

        return userUpdated;
    } catch (error) {
        throw new Error('Error update user: ' + error.message);
    }
};

module.exports = {
    updateUser
};