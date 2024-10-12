const unitService = require('../services/unitService');

// Lấy tất cả các Units
const getAllUnits = async (req, res) => {
    try {
        const units = await unitService.getAllUnits();
        return res.status(200).json(units);
    } catch (error) {
        console.error('Failed to get units:', error);
        return res.status(500).json({ message: 'Failed to get units', error: error.message });
    }
};

const getUnitById = async (req, res) => {
    const { unitId } = req.params;
    try {
        const unit = await unitService.getUnitById(unitId);
        return res.status(200).json(unit);
    } catch (error) {
        console.error('Failed to get unit:', error);
        return res.status(500).json({ message: 'Failed to get unit', error: error.message });
    }
}

module.exports = {
    getAllUnits,
    getUnitById
};
