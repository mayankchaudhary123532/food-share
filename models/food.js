const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  foodName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String, 
    required: true
  },
  expiryTime: {
    type: Date,
    required: true
  },
  location: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  geometry: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" } 
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["available", "requested", "accepted", "picked"], 
    default: "available"
  },
  // Standardized to 'requester' to match your backend routes
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  isAiVerified: {
    type: Boolean,
    default: false
  },
  aiCategory: {
    type: String,
    default: "Uncategorized"
  },
  aiReason: {
    type: String,
    trim: true
  },
  foodImage: {
    type: String 
  }
}, { timestamps: true });

foodSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Food", foodSchema);