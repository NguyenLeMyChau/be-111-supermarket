const Unit = require('../models/Unit');

// Lấy tất cả Units
const getAllUnits = async () => {
    try {
        return await Unit.find({});
    } catch (error) {
        throw new Error('Error fetching units: ' + error.message);
    }
};

const getUnitById = async (unitId) => {
    try {
        const unit = await Unit.findById(unitId);
        if (!unit) {
            throw new Error('Unit not found');
        }

        return unit;
    } catch (error) {
        throw new Error('Error fetching units: ' + error.message);
    }
}

const addUnit = async (unit) => {
    try {
        if (!unit.description) {
            throw new Error('Vui lòng nhập đơn vị tính');
        }
        return await Unit.create(unit);
    } catch (error) {
        throw new Error('Error creating unit: ' + error.message);
    }
}

const deleteUnit = async (unitId) => {
    try {
        if (!unitId) {
            throw new Error('unitId is required');
        }
        const unit = await Unit.findOne({ _id: unitId });
        if (!unit) {
            throw new Error('Unit not found');
        }

        // Delete the unit
        await Unit.deleteOne({ _id: unitId });
        return { message: 'Unit deleted successfully' };
    }
    catch (error) {
        throw new Error('Error deleting unit: ' + error.message);
    }
}

const updateUnit = async (unitId, unitData) => {
    try {
        if (!unitId) {
            throw new Error('unitId is required');
        }
        // Tìm tài liệu theo unitId
        const unit = await Unit.findOne({ _id: unitId });
        if (!unit) {
            throw new Error('Unit not found');
        }

        // Cập nhật các thuộc tính mới vào tài liệu
        unit.set({ ...unitData });

        // Lưu lại tài liệu sau khi cập nhật
        return await unit.save();
    }
    catch (error) {
        throw new Error('Error updating unit: ' + error.message);
    }
}

module.exports = {
    getAllUnits,
    getUnitById,
    addUnit,
    updateUnit,
    deleteUnit
};
