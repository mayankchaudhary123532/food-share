const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http"); 
const { Server } = require("socket.io"); 

// Load Environment Variables
dotenv.config();

const app = express();
const server = http.createServer(app); 

// 1. Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your React Frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 2. Global Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 3. Route Imports
// Note: Ensure these files exist in your 'routes' folder
const userRoutes = require("./routes/userroutes"); 
const foodRoutes = require("./routes/foodroutes"); 

// 4. API Endpoints
app.get('/', (req, res) => {
  res.send('Welcome to the Food Donation API with Real-Time Chat');
});

// Prefixing routes
app.use("/api/users", userRoutes);
app.use("/api/food", foodRoutes);

// 5. Socket.io Real-Time Logic
io.on("connection", (socket) => {
  console.log(`⚡ User Connected: ${socket.id}`);

  // Joining a room unique to the specific food item
  socket.on("join_room", (foodId) => {
    socket.join(foodId);
    console.log(`👥 User joined room: ${foodId}`);
  });

  // Handling incoming messages
  socket.on("send_message", (data) => {
    // data: { foodId, message, sender, time }
    io.to(data.foodId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected", socket.id);
  });
});

// 6. 404 Catch-all (IMPORTANT: Fixes the 404 errors in your screenshots)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found. Check your route prefixes!`
  });
});

// 7. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// 8. MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); 
  });

// 9. Server Initiation
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.io is active and listening for messages`);
});