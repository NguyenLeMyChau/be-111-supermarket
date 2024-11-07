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

const addUnitController = async (req, res) => {
    const unitData = req.body;
    try {
        const newUnit = await unitService.addUnit(unitData);
        return res.status(201).json(newUnit);
    } catch (error) {
        console.error('Failed to add unit:', error);
        return res.status(500).json({ message: 'Failed to add unit', error: error.message });
    }
}

const updateUnitController = async (req, res) => {
    const { unitId } = req.params;
    const unitData = req.body;
    try {
        const updatedUnit = await unitService.updateUnit(unitId, unitData);
        return res.status(200).json(updatedUnit);
    } catch (error) {
        console.error('Failed to update unit:', error);
        return res.status(500).json({ message: 'Failed to update unit', error: error.message });
    }
}

const deleteUnitController = async (req, res) => {
    const { unitId } = req.params;
    try {
        await unitService.deleteUnit(unitId);
        return res.status(204).end();
    } catch (error) {
        console.error('Failed to delete unit:', error);
        return res.status(500).json({ message: 'Failed to delete unit', error: error.message });
    }
}

module.exports = {
    getAllUnits,
    getUnitById,
    addUnitController,
    updateUnitController,
    deleteUnitController
};
