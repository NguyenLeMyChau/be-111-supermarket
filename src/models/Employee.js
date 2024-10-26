const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const addressSchema = new mongoose.Schema({
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    ward: { type: String, trim: true },
    street: { type: String, trim: true }
});

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: addressSchema },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    gender: { type: Boolean, required: true, trim: true }, //False: Nam, True: Nữ
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' }
});

employeeSchema.plugin(AutoIncrement, { inc_field: 'employee_index' });

const Employee = mongoose.model('employee', employeeSchema, 'employee');

module.exports = Employee;
