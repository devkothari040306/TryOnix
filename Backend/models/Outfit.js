const mongoose = require('mongoose');

const OutfitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    imageUrl: { type: String, required: true },
    buyLink: { type: String, required: true },
    store: {
      type: String,
      enum: ['Myntra', 'AJIO', 'Amazon', 'Flipkart', 'Nykaa Fashion', 'Tata CLiQ', 'Shoppers Stop', 'Lifestyle', 'Savana', 'H&M', 'Zara'],
      required: true
    },
    gender: {
      type: String,
      enum: ['Men', 'Women', 'Unisex'],
      required: true
    },
    occasion: {
      type: [String],
      enum: ['Casual', 'Office', 'Wedding', 'Party', 'Date Night', 'Beach', 'Gym', 'Festival', 'All'],
      required: true
    },
    season: {
      type: [String],
      enum: ['Summer', 'Monsoon', 'Autumn', 'Winter', 'Spring']
    },
    color: { type: String, required: true },
    stylePreference: {
      type: String,
      enum: ['Traditional Indian', 'Indo-Western', 'Formal', 'Casual', 'Party Wear', 'Festive Ethnic', 'Sportswear', 'Travel Friendly', 'Trendy Fashion', 'Smart Casual']
    },
    bodyType: {
      type: [String],
      enum: ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'Petite', 'Tall']
    },
    tags: [String],
    rating: { type: Number, min: 0, max: 5, default: 4.0 },
    reviewCount: { type: Number, default: 0 },
    isTrending: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    emoji: { type: String, default: '👗' }
  },
  { timestamps: true }
);

// Text search index
OutfitSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Outfit', OutfitSchema);