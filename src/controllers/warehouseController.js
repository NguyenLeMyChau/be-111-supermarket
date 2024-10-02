const { getAllWarehouse, getProductsByWarehouse } = require("../services/warehouseService");


async function getWarehouses(req, res) {
    try {
        const warehouses = await getAllWarehouse();
        res.status(200).json(warehouses);
    } catch (error) {
        console.error(`Error get warehouses: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getProductByWarehouse(req, res) {
    try {
        const warehouseId = req.params.warehouseId;
        const products = await getProductsByWarehouse(warehouseId);
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error get products by warehouse: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getWarehouses,
    getProductByWarehouse
};