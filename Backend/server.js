import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: "*"
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// Sample Schema (change as per your project)
const serviceSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String
});

const Service = mongoose.model("Service", serviceSchema);

// Routes
app.get("/", (req, res) => {
  res.send("TryOnix API Running 🚀");
});

app.get("/api/services", async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});