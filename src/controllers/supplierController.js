const { getAllSupplier, addSupplier, updateSupplier } = require("../services/supplierService");


async function getSuppliers(req, res) {
    try {
        const suppliers = await getAllSupplier();
        res.status(200).json(suppliers);
    } catch (error) {
        console.error(`Error get suppliers: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function addSupplierController(req, res) {
    try {
        const supplierData = req.body;
        const newSupplier = await addSupplier(supplierData);
        res.status(201).json(newSupplier);
    } catch (error) {
        console.error(`Error adding supplier: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function updateSupplierController(req, res) {
    try {
        const { supplierId } = req.params;
        const supplierData = req.body;
        const updatedSupplier = await updateSupplier(supplierId, supplierData);
        res.status(200).json(updatedSupplier);
    } catch (error) {
        console.error(`Error updating supplier: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getSuppliers,
    addSupplierController,
    updateSupplierController,
};