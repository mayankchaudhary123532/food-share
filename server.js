const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http"); 
const { Server } = require("socket.io"); 

// Load Environment Variables
dotenv.config();

// Import Models & Middleware (Make sure these paths match your project)
const Message = require("./models/message"); 
const auth = require("./middleware/auth"); 

const app = express();
const server = http.createServer(app); 

// 1. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 2. Global Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 3. API Routes (Users & Food)
const userRoutes = require("./routes/userroutes"); 
const foodRoutes = require("./routes/foodroutes"); 
app.use("/api/users", userRoutes);
app.use("/api/food", foodRoutes);

// 4. Chat History API (INLINE - No separate file needed)
// This fixes the 404 Error when the frontend tries to load messages
app.get("/api/chat/:foodId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ foodId: req.params.foodId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error loading chat history" });
  }
});

app.get('/', (req, res) => {
  res.send('Food Donation API is running...');
});

// 5. Socket.io Real-Time Logic + Database Saving
io.on("connection", (socket) => {
  console.log(`⚡ User Connected: ${socket.id}`);

  socket.on("join_room", (foodId) => {
    socket.join(foodId);
    console.log(`👥 User joined room: ${foodId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      // Save message to MongoDB so it persists on refresh
      const newMessage = new Message({
        foodId: data.foodId,
        sender: data.senderId, // Ensure frontend sends senderId
        text: data.message,
        senderName: data.senderName
      });
      await newMessage.save();

      // Emit to everyone in the room (including sender)
      io.to(data.foodId).emit("receive_message", data);
    } catch (err) {
      console.error("Socket Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected", socket.id);
  });
});

// 6. 404 Catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`
  });
});

// 7. MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); 
  });

// 8. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});