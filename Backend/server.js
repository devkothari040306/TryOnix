import multer from "multer";
import axios from "axios";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { Client, handle_file } from "@gradio/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const JWT_SECRET = process.env.JWT_SECRET;
const TRYON_SPACE_ID = process.env.HF_TRYON_SPACE_ID || "yisol/IDM-VTON";
let tryOnClientPromise;

const app = express();

app.use(express.json());
app.use(cors());

// ─── MULTER CONFIG ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
});

async function imageUrlToBuffer(imageUrl) {
  const url = new URL(imageUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Invalid cloth image URL");
  }

  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });

  return {
    buffer: Buffer.from(response.data),
    mimeType: response.headers["content-type"] || "image/png",
  };
}

function getTryOnClient() {
  if (!tryOnClientPromise) {
    tryOnClientPromise = Client.connect(TRYON_SPACE_ID, {
      token: process.env.HF_TOKEN,
    });
  }

  return tryOnClientPromise;
}

function toHumanEditorInput(file) {
  return {
    background: handle_file(file.buffer),
    layers: [],
    composite: null,
  };
}

function getGradioFileUrl(fileData) {
  if (!fileData) return "";
  if (typeof fileData === "string") return fileData;
  if (Array.isArray(fileData)) return getGradioFileUrl(fileData[0]);

  return (
    fileData.url ||
    fileData.path ||
    fileData.image?.url ||
    fileData.image?.path ||
    ""
  );
}

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
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function getAuthUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.authUser = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
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
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

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
      JWT_SECRET,
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
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

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
      JWT_SECRET,
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

// CURRENT USER
app.get("/api/auth/me", authMiddleware, getAuthUser, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.authUser._id,
      name: req.authUser.name,
      email: req.authUser.email,
    },
  });
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
  authMiddleware,
  upload.fields([
    { name: "person", maxCount: 1 },
    { name: "cloth", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!process.env.HF_TOKEN) {
        return res.status(500).json({
          success: false,
          message: "HF_TOKEN is not configured",
        });
      }

      if (!req.files?.person) {
        return res.status(400).json({
          success: false,
          message: "Person image is required",
        });
      }

      const personFile = req.files.person[0];
      const clothFile = req.files?.cloth
        ? req.files.cloth[0]
        : req.body.clothUrl
          ? await imageUrlToBuffer(req.body.clothUrl)
          : null;

      if (!clothFile) {
        return res.status(400).json({
          success: false,
          message: "Cloth image or clothUrl is required",
        });
      }

      const client = await getTryOnClient();
      const result = await client.predict("/tryon", {
        dict: toHumanEditorInput(personFile),
        garm_img: handle_file(clothFile.buffer),
        garment_des: req.body.garmentDescription || "selected outfit",
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: Number(req.body.denoiseSteps || 30),
        seed: Number(req.body.seed || 42),
      });

      res.json({
        success: true,
        resultImageUrl: getGradioFileUrl(result.data),
        maskImageUrl: getGradioFileUrl(result.data?.[1]),
        data: result.data,
      });
    } catch (error) {
      console.error(
        "TryOn Error:",
        error.response?.data || error.message
      );

      res.status(500).json({
        success: false,
        message:
          error.response?.data?.error ||
          error.message ||
          "Try-on generation failed",
      });
    }
  }
);

// ─── START SERVER ──────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
