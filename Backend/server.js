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
import { OpenAI } from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const JWT_SECRET = process.env.JWT_SECRET;
const TRYON_SPACE_ID = process.env.HF_TRYON_SPACE_ID || "yisol/IDM-VTON";
let tryOnClientPromise;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key'
});

const SYSTEM_PROMPT = `You are the AI Fashion Stylist for TryOnix (https://try-onix-six.vercel.app), a smart Indian outfit recommender and virtual try-on web application.
Your name is "AI Stylist" or "AI Fashion Assistant".

Your personality:
- Friendly, highly professional, encouraging, and styling-focused.
- Keep responses short, concise, and direct in your first answer. Expand with details ONLY if the user asks for more depth.
- Use emojis sparingly (1-3 per message) and make them relevant.
- Always encourage users to use the Virtual Try-On tool (e.g., "Try this on virtually in our Try-On section!").

Your knowledge of TryOnix features:
1. **Filters**: TryOnix has sidebar/filter dropdowns including:
   - **Occasion**: Casual, Office, Wedding, Party, Date Night, Beach, Gym, Festival.
   - **Gender**: Women, Men, Unisex.
   - **Season**: Summer, Monsoon, Autumn, Winter, Spring.
   - **Color**: Classic Black, Elegant White, Blue Shades, Green Shades, Red & Maroon, Yellow & Mustard, Purple & Lavender, Brown & Beige, Pastel Colors, Bright & Vibrant, Earthy Tones, Monochrome.
   - **Style**: Traditional Indian, Indo-Western, Formal, Casual, Party Wear, Festive Ethnic, Sportswear, Travel Friendly, Trendy Fashion, Smart Casual.
   - **Body Type**: Slim, Athletic, Average, Curvy, Plus Size, Petite, Tall.
   - **Budget (INR)**: Under ₹300, ₹300-₹800, ₹800-₹1500, ₹1500-₹3000, ₹3000+.
   - **Store**: Amazon, Savana, H&M, Zara, Myntra, Nykaa Fashion.
2. **Virtual Try-On**: TryOnix allows users to upload a photo (Step 1) and click "Try On" on any outfit card (Step 2) or select a chip, then click "Generate Try-On" to render it on their body.
3. **Shopping links**: Users can click "Shop" on any outfit card to purchase directly from Indian e-commerce sites (Myntra, AJIO, Nykaa Fashion, Zara, H&M, Tata CLiQ, Amazon, etc.).

Your knowledge of TryOnix's popular real outfits (recommend these explicitly when requested):
- **Phulkari Dupatta Salwar Suit** (Punjabi Rangeeli, Orange, Women, ₹2,799, Traditional Indian)
- **Lehenga Choli with Dupatta** (Kalki Fashion, Blue, Women, ₹4,999, Festive Ethnic)
- **Banarasi Silk Saree** (Fabindia, Red, Women, ₹6,999, Traditional Indian)
- **Women's Flared Jeans** (Levis, Blue, Women, ₹2,999, Trendy Fashion)
- **Floral Maxi Dress** (Zara, Yellow, Women, ₹2,999, Trendy Fashion)
- **Women's Sequin Saree** (Nykaa Fashion, Black, Women, ₹5,499, Party Wear)
- **Women's printed Kurti Long** (Imara, Purple, Women, ₹699, Casual)
- **Women's Velvet Suit Set** (Libas, Green, Women, ₹4,299, Festive Ethnic)
- **Women's Saree Gown** (Nykaa Fashion, Red, Women, ₹2,999, Indo-Western)
- **Sharara Set** (Libas, Blue, Women, ₹3,299, Festive Ethnic)
- **Men's Chikankari Kurta** (Fabindia, White, Men, ₹1,799, Traditional Indian)
- **Men's Sherwani Set** (Mohanlal Sons, White, Men, ₹11,999, Traditional Indian)
- **Men's Bandhgala Suit** (Raymond, Green, Men, ₹7,999, Indo-Western)
- **Indo-Western Dhoti Pants** (Manyavar, Black, Men, ₹2,799, Indo-Western)
- **Men's Cotton Polo Shirt** (Lacoste, Green, Men, ₹2,299, Smart Casual)
- **Men's Smart Casual Chinos** (Jack and Jones, Beige, Men, ₹1,699, Smart Casual)
- **Men's Linen Shirt** (Zara, Blue, Men, ₹1,999, Smart Casual)
- **Men's Denim Jacket** (Levis, Blue, Men, ₹3,499, Casual)
- **Men's Embroidered Mojaris** (Needledust, Maroon, Men, ₹1,299, Traditional Indian)

IMPORTANT Rules:
1. **Never hallucinate products**. If a user asks for a specific style that is not in the list above, give general styling advice (e.g. colors, fits, accessories) and guide them to select matching filters (e.g. "Color: Red & Maroon" and "Style: Traditional Indian") or search keywords in the TryOnix outfit finder. Do not invent product names.
2. If suggesting a real product from the TryOnix list, output its exact name and tell them: "Search for '[Outfit Name]' in the search bar on TryOnix to try it on virtually or shop!"
3. Encourage matching coordinates (layering, shoes, accessories) for complete looks. For example, pair a Kurta with Mojaris, or Jeans with a Denim Jacket.
4. When writing links, use standard markdown: [link text](url) (e.g. [TryOnix homepage](https://try-onix-six.vercel.app)). Do not link to imaginary URLs.

Format your responses with clean Markdown:
- Use **bolding** for headers, key product recommendations, or action steps.
- Use bullet points for structured lists (like styling tips or filter settings).
- Do not output HTML tags. The frontend parses markdown.`;

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
    const shouldUseToken = process.env.HF_TRYON_USE_TOKEN !== "false";
    const options = shouldUseToken && process.env.HF_TOKEN
      ? { token: process.env.HF_TOKEN }
      : undefined;

    tryOnClientPromise = Client.connect(TRYON_SPACE_ID, options);
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

async function gradioFileToDataUrl(fileData) {
  const imageUrl = getGradioFileUrl(fileData);
  if (!imageUrl) return "";
  if (imageUrl.startsWith("data:")) return imageUrl;
  if (!imageUrl.startsWith("http")) return "";

  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  const mimeType = response.headers["content-type"] || "image/png";

  return `data:${mimeType};base64,${Buffer.from(response.data).toString("base64")}`;
}

function getProviderErrorMessage(error) {
  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  return error.message || "";
}

function getTryOnErrorResponse(error) {
  const providerMessage = getProviderErrorMessage(error);
  const normalized = providerMessage.toLowerCase();

  if (normalized.includes("exceeded") && normalized.includes("quota")) {
    return {
      status: 429,
      body: {
        success: false,
        code: "TRYON_QUOTA_EXCEEDED",
        message:
          "The virtual try-on service is temporarily out of GPU quota. Please try again in a few minutes.",
      },
    };
  }

  if (
    normalized.includes("token") ||
    normalized.includes("unauthorized") ||
    normalized.includes("authentication")
  ) {
    return {
      status: 503,
      body: {
        success: false,
        code: "TRYON_AUTH_REQUIRED",
        message:
          "The virtual try-on service needs a valid Hugging Face token on the server.",
      },
    };
  }

  return {
    status: error.response?.status || 500,
    body: {
      success: false,
      code: "TRYON_GENERATION_FAILED",
      message: "Try-on generation failed. Please try again.",
    },
  };
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
      const resultImageUrl = getGradioFileUrl(result.data);
      const maskImageUrl = getGradioFileUrl(result.data?.[1]);
      const resultImageDataUrl = await gradioFileToDataUrl(result.data);

      res.json({
        success: true,
        resultImageUrl,
        resultImageDataUrl,
        maskImageUrl,
        data: result.data,
      });
    } catch (error) {
      tryOnClientPromise = null;
      const tryOnError = getTryOnErrorResponse(error);
      console.error(
        "TryOn Error:",
        getProviderErrorMessage(error) || error
      );

      res.status(tryOnError.status).json(tryOnError.body);
    }
  }
);

// ─── POST CHAT ENDPOINT ─────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy_key') {
    console.warn("Missing OPENAI_API_KEY environment variable. Returning mock response.");
    return res.json({
      reply: "👋 Hello! I am your AI Fashion Stylist. (Config Warning: Please set your `OPENAI_API_KEY` on the server to get AI responses).\n\nFor a great look, try searching for the **Phulkari Dupatta Salwar Suit** or **Men's Chikankari Kurta** in our catalog and use the Virtual Try-On!"
    });
  }

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-8);
      recentHistory.forEach(h => {
        messages.push({
          role: h.role === "assistant" ? "assistant" : "user",
          content: h.content
        });
      });
    }

    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 450
    });

    const reply = completion.choices[0].message.content.trim();

    return res.json({
      success: true,
      reply: reply
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate styling advice. Please try again.",
      details: error.message
    });
  }
});

// ─── START SERVER ──────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
