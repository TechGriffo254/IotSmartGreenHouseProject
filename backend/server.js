require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDb = require("./Config/db");
const socketHandler = require("./sockets/socketHandler");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://iot-smart-green-house-project.vercel.app",
            "https://open-lauryn-ina-9662925b.koyeb.app",
            "http://localhost:3000",
            "https://localhost:3000",
          ]
        : ["http://localhost:3000"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Attach Socket Handler
socketHandler(io);
app.set("io", io);

// Connect to DB and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT,async (params) => {
  try {
    await connectDb()
    console.log(`server running at loclhost ${PORT}`)
  } catch (error) {
    console.log("error connecting to the server",error)
  }
})