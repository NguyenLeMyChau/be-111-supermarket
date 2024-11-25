const handlerSocket = (io) => {
    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);
  
      socket.on("paymentSuccess", (invoice) => {
        console.log("Received paymentSuccess:", invoice);
        io.emit("newInvoice", invoice);
      });

      socket.on("updateStatusSuccess", (data) => {
        console.log("Received updateStatusSuccess:",data);
        io.emit("updateStatus", {invoiceCode: data.invoiceCode, status:data.status });
      });


      // Xử lý ngắt kết nối
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  };
  
  module.exports =handlerSocket;