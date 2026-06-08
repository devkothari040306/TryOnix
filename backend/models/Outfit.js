const mongoose = require("mongoose");

const OutfitSchema = new mongoose.Schema({
  name: String,
  brand: String,
  gender: String,
  occasion: String,
  style: String,
  price: Number,
  store: String,
  link: String
});

module.exports = mongoose.model("Outfit", OutfitSchema);