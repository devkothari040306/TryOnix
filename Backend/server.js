import multer from "multer";
import axios from "axios";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// ─── MULTER CONFIG ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
});

// ─── MONGODB CONNECTION ────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ Mongo Error:", err);
    process.exit(1);
  });

// ─── USER SCHEMA (JWT AUTH) ─────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// ─── OUTFIT SCHEMA ──────────────────────────────
const outfitSchema = new mongoose.Schema({}, { strict: false });
const Outfit = mongoose.model("Outfit", outfitSchema, "outfits");

// ─── JWT MIDDLEWARE (ADDED) ─────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ─── HEALTH CHECK ROUTE ────────────────────────
app.get("/", (req, res) => {
  res.send("TryOnix API Running 🚀");
});

// ─── AUTH ROUTES ────────────────────────────────

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // FIXED RESPONSE (ADDED USER DATA)
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // FIXED RESPONSE (ADDED USER DATA)
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET OUTFITS ───────────────────────────────
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

    if (style) query.stylePreference = style;
    if (bodyType) query.bodyType = bodyType;

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

// ─── TRY ON ROUTE ──────────────────────────────
app.post(
  "/api/tryon",
  upload.fields([
    { name: "person", maxCount: 1 },
    { name: "cloth", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files?.person || !req.files?.cloth) {
        return res.status(400).json({
          success: false,
          message: "Person image and cloth image are required",
        });
      }

      const personImage = req.files.person[0].buffer.toString("base64");
      const clothImage = req.files.cloth[0].buffer.toString("base64");

      const response = await axios.post(
        "https://api-inference.huggingface.co/models/yisol/IDM-VTON",
        {
          person_image: personImage,
          garment_image: clothImage,
        },
        {
          headers: {
            Authorization: "Bearer " + process.env.HF_TOKEN,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error(
        "TryOn Error:",
        error.response?.data || error.message
      );

      res.status(500).json({
        success: false,
        message: "Try-on generation failed",
      });
    }
  }
);

// ─── START SERVER ──────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});