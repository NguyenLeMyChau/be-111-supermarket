const { getAllSupplier } = require("../services/supplierService");


async function getSuppliers(req, res) {
    try {
        const suppliers = await getAllSupplier();
        res.status(200).json(suppliers);
    } catch (error) {
        console.error(`Error get suppliers: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getSuppliers,
};