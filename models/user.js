const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Prevents "User@mail.com" vs "user@mail.com" issues
    trim: true
  },
  password: { 
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["restaurant", "ngo", "admin"],
    required: true
  },
  location: {
    type: String // Optional: can store general city/area
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);