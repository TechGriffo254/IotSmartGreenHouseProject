const jwt = require("jsonwebtoken");

const socketHandler = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication token required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      socket.role = decoded.role;

      console.log(`Authenticated: ${decoded.username}`);
      next();
    } catch (err) {
      console.error(" Socket authentication failed:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id} (${socket.username})`);

    socket.on("join-greenhouse", (greenhouseId) => {
      socket.join(`greenhouse-${greenhouseId}`);
      socket.emit("greenhouse-joined", {
        greenhouseId,
        message: "Successfully joined greenhouse",
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("device-control", (data) => {
      const { deviceId, action, greenhouseId } = data;
      console.log(`🎛️ ${socket.username}: ${deviceId} -> ${action}`);

      io.to(`greenhouse-${greenhouseId}`).emit("deviceControl", {
        type: "deviceControl",
        deviceId,
        action,
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString(),
      });

      io.to(`greenhouse-${greenhouseId}`).emit("device-control-update", {
        deviceId,
        action,
        user: socket.username,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Disconnected: ${socket.username} - ${reason}`);
    });
  });
};

module.exports = socketHandler;
