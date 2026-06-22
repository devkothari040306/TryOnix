const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Outfit = require('./models/Outfit');
const outfits = require('./seed.json');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    await Outfit.deleteMany({});
    console.log('🗑️  Cleared existing outfits');

    const inserted = await Outfit.insertMany(outfits);
    console.log(`🌱 Seeded ${inserted.length} outfits successfully`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();