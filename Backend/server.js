import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ Mongo Error:", err);
    process.exit(1);
  });

const outfitSchema = new mongoose.Schema({}, { strict: false });
const Outfit = mongoose.model("Outfit", outfitSchema, "outfits");

app.get("/", (req, res) => {
  res.send("TryOnix API Running 🚀");
});

app.get("/api/outfits", async (req, res) => {
  try {
    const {
      gender,
      occasion,
      season,
      color,
      style,
      bodyType,
      store,
      search,
      limit = 80,
    } = req.query;

    const query = {};

    if (gender) query.gender = gender;
    if (occasion) query.occasion = occasion;
    if (season) query.season = season;
    if (color) query.color = color;
    if (store) query.store = store;

    if (style) {
      query.stylePreference = style;
    }

    if (bodyType) {
      query.bodyType = bodyType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const outfits = await Outfit.find(query).limit(Number(limit));

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});