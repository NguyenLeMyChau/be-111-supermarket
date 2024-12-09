const handlerSocket = (io) => {
  io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Lắng nghe sự kiện "paymentSuccess" từ client
      socket.on("paymentSuccess", (invoice) => {
          console.log("Received paymentSuccess:", invoice);
          // Emit sự kiện "newInvoice" cho tất cả client
          io.emit("newInvoice", invoice);
      });

      // Lắng nghe sự kiện "updateStatusSuccess" từ client
      socket.on("updateStatusSuccess", (data) => {
          console.log("Received updateStatusSuccess:", data);
          // Emit sự kiện "updateStatus" cho tất cả client
          io.emit("updateStatus", { invoiceCode: data.invoiceCode, status: data.status });
      });

      // Xử lý ngắt kết nối
      socket.on("disconnect", () => {
          console.log(`Client disconnected: ${socket.id}`);
      });
  });
};

module.exports = handlerSocket;
