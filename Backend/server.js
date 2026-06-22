import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ Mongo Error:", err);
    process.exit(1);
  });

// Outfit Model
const outfitSchema = new mongoose.Schema({}, { strict: false });

const Outfit = mongoose.model("Outfit", outfitSchema, "outfits");

// Root Route
app.get("/", (req, res) => {
  res.send("TryOnix API Running 🚀");
});

// Get All Outfits
app.get("/api/outfits", async (req, res) => {
  try {
    const outfits = await Outfit.find();

    res.status(200).json({
      success: true,
      count: outfits.length,
      data: outfits,
    });
  } catch (error) {
    console.error("Error fetching outfits:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});