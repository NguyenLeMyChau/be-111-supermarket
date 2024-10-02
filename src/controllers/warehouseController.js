const { getAllWarehouse } = require("../services/warehouseService");


async function getWarehouses(req, res) {
    try {
        const warehouses = await getAllWarehouse();
        res.status(200).json(warehouses);
    } catch (error) {
        console.error(`Error get warehouses: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getWarehouses
};