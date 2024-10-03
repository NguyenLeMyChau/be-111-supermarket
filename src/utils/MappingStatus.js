
// Danh sách trạng thái hợp lệ
const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// Bộ chuyển đổi từ tiếng Việt sang trạng thái hợp lệ
const vietnameseToStatus = {
    'Đang chờ xử lý': 'PENDING',
    'Đã duyệt': 'APPROVED',
    'Bị từ chối': 'REJECTED',
    'Đang giao hàng': 'SHIPPED',
    'Đã giao hàng': 'DELIVERED',
    'Đã hủy': 'CANCELLED',
};

const statusToVietnamese = {
    'PENDING': 'Đang chờ xử lý',
    'APPROVED': 'Đã duyệt',
    'REJECTED': 'Bị từ chối',
    'SHIPPED': 'Đang giao hàng',
    'DELIVERED': 'Đã giao hàng',
    'CANCELLED': 'Đã hủy',
};

// Hàm chuyển đổi trạng thái từ tiếng Việt sang trạng thái hợp lệ
const mapVietnameseStatusToValidStatus = (statusInVietnamese) => {
    return vietnameseToStatus[statusInVietnamese] || null;
};

// Hàm chuyển đổi trạng thái từ hợp lệ sang tiếng Việt
const mapValidStatusToVietnamese = (status) => {
    return statusToVietnamese[status] || null;
};

// Export các hàm và biến cần thiết
module.exports = {
    validStatuses,
    mapVietnameseStatusToValidStatus,
    mapValidStatusToVietnamese
};
