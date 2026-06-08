const express = require("express");
const router = express.Router();
const Outfit = require("../models/Outfit");

// GET all outfits
router.get("/", async (req, res) => {
  try {
    const outfits = await Outfit.find();
    res.json(outfits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;