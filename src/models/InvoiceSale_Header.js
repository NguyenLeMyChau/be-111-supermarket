const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const addressSchema = new mongoose.Schema({
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    ward: { type: String, trim: true },
    street: { type: String, trim: true }
});

const invoiceSaleHeaderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account', trim: true },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'employee', trim: true },
    paymentInfo: {
        name: { type: String, trim: true },
        address: { type: addressSchema },
        phone: { type: String, trim: true },
        gender: { type: Boolean, trim: true }
    },
    paymentMethod: { type: String, required: true },
    paymentAmount: { type: Number, required: true },
    invoiceCode: { type: String, unique: true }  // Mã hóa đơn tự động
}, { timestamps: true });

invoiceSaleHeaderSchema.plugin(AutoIncrement, { inc_field: 'invoiceSaleHeader_index' });

// Middleware để tạo mã hóa đơn tự động
invoiceSaleHeaderSchema.pre('save', function (next) {
    if (!this.invoiceCode) {  // Kiểm tra nếu chưa có mã hóa đơn
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');  // Thêm 0 nếu cần
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Tạo mã hóa đơn với định dạng: YYYYMMDDHHMMSS
        this.invoiceCode = `IV${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    next();
});

const InvoiceSaleHeader = mongoose.model('invoiceSale_header', invoiceSaleHeaderSchema, 'invoiceSale_header');

module.exports = InvoiceSaleHeader;
