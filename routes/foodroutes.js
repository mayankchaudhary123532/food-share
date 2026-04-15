const express = require("express");
const router = express.Router();
const Food = require("../models/food");
const auth = require("../middleware/auth");
const multer = require("multer");
const { verifyFoodImage } = require("../services/aiService");

// Multer Setup for AI Processing
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

/**
 * @route   POST /api/food/add
 * @desc    Add a new food donation (Restaurant Only)
 */
router.post("/add", auth, upload.single("foodImage"), async (req, res) => {
  try {
    if (req.user.role !== "restaurant") {
      return res.status(403).json({ message: "Only restaurants can donate food." });
    }

    const { foodName, quantity, location, expiryTime } = req.body;

    // AI Verification
    let aiStatus = { isFresh: true, category: "General", reason: "No image provided" };
    if (req.file) {
      try {
        aiStatus = await verifyFoodImage(req.file.buffer, req.file.mimetype);
        if (!aiStatus.isFresh) {
          return res.status(400).json({ message: `AI Analysis: ${aiStatus.reason}` });
        }
      } catch (aiErr) {
        console.error("AI Error:", aiErr.message);
        return res.status(500).json({ message: "AI Verification service is down." });
      }
    }

    // Location Parsing
    let parsedLoc;
    try {
      parsedLoc = typeof location === "string" ? JSON.parse(location) : location;
    } catch (e) {
      return res.status(400).json({ message: "Invalid location format." });
    }

    const food = await Food.create({
      foodName: foodName.trim(),
      quantity: quantity.trim(),
      expiryTime,
      location: {
        address: parsedLoc.address,
        lat: Number(parsedLoc.lat),
        lng: Number(parsedLoc.lng)
      },
      donor: req.user.id,
      status: "available",
      isAiVerified: !!req.file,
      aiCategory: aiStatus.category
    });

    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   GET /api/food/available
 * @desc    NGO browses all available food
 */
router.get("/available", auth, async (req, res) => {
  try {
    const food = await Food.find({ status: "available" })
      .populate("donor", "name")
      .sort({ createdAt: -1 });
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/food/my-requests
 * @desc    NGO views items they have claimed
 */
router.get("/my-requests", auth, async (req, res) => {
  try {
    const claims = await Food.find({ requester: req.user.id })
      .populate("donor", "name")
      .sort({ updatedAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/food/my-donations
 * @desc    Restaurant views items they donated
 */
router.get("/my-donations", auth, async (req, res) => {
  try {
    const donations = await Food.find({ donor: req.user.id })
      .populate("requester", "name email") // Added so restaurant can see who requested
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/food/request/:id
 * @desc    NGO claims a food item
 */
router.put("/request/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "ngo") {
      return res.status(403).json({ message: "Only NGOs can request food." });
    }
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { status: "requested", requester: req.user.id },
      { new: true }
    );
    res.json(food);
  } catch (error) {
    res.status(400).json({ message: "Request failed" });
  }
});

/**
 * @route   PUT /api/food/accept/:id
 * @desc    Restaurant accepts an NGO's request (FIXES YOUR 404 ERROR)
 */
router.put("/accept/:id", auth, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ message: "Food item not found" });
    }

    // Security check: Only the owner (donor) can accept
    if (food.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized. You are not the donor of this item." });
    }

    food.status = "accepted";
    await food.save();

    res.json({ message: "Request accepted successfully!", food });
  } catch (error) {
    console.error("Accept Route Error:", error);
    res.status(500).json({ message: "Server error during acceptance" });
  }
});

/**
 * @route   PUT /api/food/picked/:id
 * @desc    Mark food as successfully picked up
 */
router.put("/picked/:id", auth, async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { status: "picked" },
      { new: true }
    );
    res.json({ message: "Food marked as picked up!", food });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;