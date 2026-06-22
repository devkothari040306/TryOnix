const express = require('express');
const router = express.Router();
const Outfit = require('../models/Outfit');

// ─── GET /api/outfits ─────────────────────────────────────────────────────────
// Query params: gender, occasion, season, color, style, bodyType, store, budget,
//               search, sort, page, limit
router.get('/', async (req, res) => {
  try {
    const {
      gender, occasion, season, color, style, bodyType, store,
      budget, search, sort = 'trending', page = 1, limit = 50
    } = req.query;

    const filter = {};

    if (gender && gender !== '' && gender !== 'All Genders') filter.gender = gender;
    if (occasion && occasion !== '' && occasion !== 'All') filter.occasion = { $in: [occasion] };
    if (season) {
      const cleanSeason = season.replace(/^[^\w]+/, '').trim();
      if (cleanSeason) filter.season = { $in: [cleanSeason] };
    }
    if (color) filter.color = { $regex: color.replace(/^[^\w]+/, '').trim(), $options: 'i' };
    if (style) filter.stylePreference = { $regex: style.replace(/^[^\w]+/, '').trim(), $options: 'i' };
    if (bodyType) filter.bodyType = { $in: [bodyType.replace(/^[^\w]+/, '').trim()] };
    if (store && store !== '' && store !== 'All Stores') filter.store = store.trim();

    // Budget filter
    if (budget) {
      if (budget === 'Under 300') filter.price = { $lt: 300 };
      else if (budget.includes('300') && budget.includes('800')) filter.price = { $gte: 300, $lte: 800 };
      else if (budget.includes('800') && budget.includes('1500')) filter.price = { $gte: 800, $lte: 1500 };
      else if (budget.includes('1500') && budget.includes('3000')) filter.price = { $gte: 1500, $lte: 3000 };
      else if (budget === '₹3000+') filter.price = { $gte: 3000 };
    }

    // Text search
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort
    let sortObj = {};
    if (sort === 'trending' || sort === 'Trending') sortObj = { isTrending: -1, rating: -1 };
    else if (sort === 'Best Match') sortObj = { rating: -1, reviewCount: -1 };
    else if (sort === 'Price: Low to High') sortObj = { price: 1 };
    else if (sort === 'Price: High to Low') sortObj = { price: -1 };
    else if (sort === 'Top Rated') sortObj = { rating: -1 };
    else sortObj = { isTrending: -1, rating: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [outfits, total] = await Promise.all([
      Outfit.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)),
      Outfit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: outfits
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── GET /api/outfits/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id);
    if (!outfit) return res.status(404).json({ success: false, message: 'Outfit not found' });
    res.json({ success: true, data: outfit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── POST /api/outfits ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const outfit = await Outfit.create(req.body);
    res.status(201).json({ success: true, data: outfit });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Validation error', error: err.message });
  }
});

// ─── PUT /api/outfits/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!outfit) return res.status(404).json({ success: false, message: 'Outfit not found' });
    res.json({ success: true, data: outfit });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Validation error', error: err.message });
  }
});

// ─── DELETE /api/outfits/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findByIdAndDelete(req.params.id);
    if (!outfit) return res.status(404).json({ success: false, message: 'Outfit not found' });
    res.json({ success: true, message: 'Outfit deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;