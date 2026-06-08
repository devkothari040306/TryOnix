require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.get("/", (req, res) => {
  res.send("TryOnix Backend Working");
});

const PORT = process.env.PORT || 5000;
app.use("/api/outfits", require("./routes/outfits"));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});