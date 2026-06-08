
// ─── OUTFIT DATA ───────────────────────────────────────────────────
const outfits = [
  {
    id:1, name:"Floral Midi Wrap Dress", brand:"Amazon Fashion",
    emoji:"👗", gender:"Women", occasion:"Casual",
    weather:"☀️ Summer / Hot", color:"Warm Tones (Red/Orange/Yellow)",
    style:"Bohemian", body:"Hourglass", price:45, oldPrice:68,
    rating:4.7, reviews:1240,
    store:"Amazon Fashion",
    link:"https://www.amazon.com/s?k=floral+midi+wrap+dress",
    desc:"A breezy floral wrap dress perfect for summer days, brunches, and casual outings. Adjustable tie waist flatters all figures.",
    tags:["Floral","Midi Length","Wrap Style","Summer","Casual"]
  },
  {
    id:2, name:"Tailored Blazer Set", brand:"Savana",
    emoji:"👔", gender:"Women", occasion:"Office",
    weather:"🍂 Autumn / Mild", color:"Neutrals (Black/White/Beige)",
    style:"Minimalist", body:"Rectangle", price:89, oldPrice:120,
    rating:4.8, reviews:876,
    store:"Savana",
    link:"https://en.savana.com",
    desc:"A structured blazer and high-waist trouser set that commands the boardroom. Clean lines, professional edge.",
    tags:["Blazer","Co-ord Set","Office","Tailored","Power Dressing"]
  },
  {
    id:3, name:"Oversized Streetwear Hoodie", brand:"ASOS",
    emoji:"🧥", gender:"Unisex", occasion:"Casual",
    weather:"❄️ Winter / Cold", color:"Cool Tones (Blue/Green/Purple)",
    style:"Streetwear", body:"Rectangle", price:38, oldPrice:55,
    rating:4.5, reviews:3210,
    store:"ASOS",
    link:"https://www.asos.com/search/?q=oversized+hoodie",
    desc:"Chunky ribbed oversized hoodie with dropped shoulders. The go-to piece for effortless street style.",
    tags:["Hoodie","Oversized","Streetwear","Unisex","Warm"]
  },
  {
    id:4, name:"Boho Maxi Skirt & Top", brand:"H&M",
    emoji:"🌻", gender:"Women", occasion:"Festival",
    weather:"☀️ Summer / Hot", color:"Earth Tones",
    style:"Bohemian", body:"Pear / Triangle", price:55, oldPrice:75,
    rating:4.6, reviews:990,
    store:"H&M",
    link:"https://www.hm.com/en_in/women/new-arrivals.html",
    desc:"Flowing maxi skirt with matching crop top. Earth-toned print inspired by global festival culture.",
    tags:["Boho","Maxi Skirt","Co-ord","Festival","Summer"]
  },
  {
    id:5, name:"Classic White Linen Shirt", brand:"Zara",
    emoji:"👕", gender:"Men", occasion:"Casual",
    weather:"☀️ Summer / Hot", color:"Neutrals (Black/White/Beige)",
    style:"Minimalist", body:"Inverted Triangle", price:42, oldPrice:58,
    rating:4.4, reviews:2100,
    store:"Zara",
    link:"https://www.zara.com/in/en/man-shirts-l737.html",
    desc:"Relaxed linen shirt for effortless summer dressing. Breathable, timeless, versatile.",
    tags:["Linen","White","Men","Casual","Summer"]
  },
  {
    id:6, name:"Sequin Party Mini Dress", brand:"Myntra",
    emoji:"✨", gender:"Women", occasion:"Party",
    weather:"🍂 Autumn / Mild", color:"Bold & Vibrant",
    style:"Glamour", body:"Hourglass", price:72, oldPrice:99,
    rating:4.9, reviews:640,
    store:"Myntra",
    link:"https://www.myntra.com/dresses?f=Gender%3Awomen%3A%3AOccasion%3AParty&rawQuery=party+dress",
    desc:"Head-turning sequin mini dress for nights out. Fully lined, side zip, perfect for parties and date nights.",
    tags:["Sequin","Party","Mini Dress","Glam","Night Out"]
  },
  {
    id:7, name:"Athletic Yoga Set", brand:"Amazon Fashion",
    emoji:"🏃", gender:"Women", occasion:"Gym",
    weather:"Any", color:"Cool Tones (Blue/Green/Purple)",
    style:"Athleisure", body:"All Body Types", price:35, oldPrice:50,
    rating:4.7, reviews:4500,
    store:"Amazon Fashion",
    link:"https://www.amazon.com/s?k=women+yoga+set+activewear",
    desc:"Moisture-wicking 4-way stretch leggings and matching sports bra. Designed for yoga, pilates, and gym.",
    tags:["Yoga","Activewear","Gym","Leggings","Sports Bra"]
  },
  {
    id:8, name:"Ethnic Anarkali Suit", brand:"Nykaa Fashion",
    emoji:"🌸", gender:"Women", occasion:"Wedding",
    weather:"Any", color:"Warm Tones (Red/Orange/Yellow)",
    style:"Classic / Preppy", body:"All Body Types", price:120, oldPrice:180,
    rating:4.8, reviews:1100,
    store:"Nykaa Fashion",
    link:"https://www.nykaafashion.com/women/ethnic-wear/kurtas-kurtis",
    desc:"Elegant Anarkali with intricate embroidery and dupatta. Perfect for Indian weddings, Diwali, and festive occasions.",
    tags:["Anarkali","Ethnic","Wedding","Embroidery","Indian Wear"]
  },
  {
    id:9, name:"Trench Coat — Beige", brand:"Zara",
    emoji:"🧣", gender:"Women", occasion:"Office",
    weather:"🍂 Autumn / Mild", color:"Neutrals (Black/White/Beige)",
    style:"Classic / Preppy", body:"Rectangle", price:145, oldPrice:195,
    rating:4.6, reviews:780,
    store:"Zara",
    link:"https://www.zara.com/in/en/woman-coats-l1017.html",
    desc:"Timeless double-breasted trench coat. A wardrobe hero that pairs with everything from jeans to dresses.",
    tags:["Trench Coat","Beige","Classic","Autumn","Outerwear"]
  },
  {
    id:10, name:"Y2K Baby Tee & Cargo", brand:"ASOS",
    emoji:"🌈", gender:"Women", occasion:"Casual",
    weather:"☀️ Summer / Hot", color:"Bold & Vibrant",
    style:"Y2K / Retro", body:"Petite", price:48, oldPrice:70,
    rating:4.5, reviews:2300,
    store:"ASOS",
    link:"https://www.asos.com/search/?q=y2k+cargo+set",
    desc:"Retro Y2K vibes with a cropped baby tee and low-rise cargo pants. Nostalgia meets modern streetwear.",
    tags:["Y2K","Retro","Baby Tee","Cargo","Gen Z"]
  },
  {
    id:11, name:"Men's Navy Suit Set", brand:"Amazon Fashion",
    emoji:"🤵", gender:"Men", occasion:"Wedding",
    weather:"🍂 Autumn / Mild", color:"Cool Tones (Blue/Green/Purple)",
    style:"Classic / Preppy", body:"Rectangle", price:180, oldPrice:250,
    rating:4.7, reviews:560,
    store:"Amazon Fashion",
    link:"https://www.amazon.com/s?k=men+navy+suit+formal",
    desc:"Slim-fit three-piece navy suit for weddings, galas, and black-tie events. Timeless sophistication.",
    tags:["Suit","Men","Formal","Navy","Wedding"]
  },
  {
    id:12, name:"Cottagecore Prairie Dress", brand:"H&M",
    emoji:"🌿", gender:"Women", occasion:"Casual",
    weather:"🌸 Spring", color:"Pastels",
    style:"Cottagecore", body:"Hourglass", price:52, oldPrice:72,
    rating:4.6, reviews:1450,
    store:"H&M",
    link:"https://www.hm.com/en_in/women/dresses.html",
    desc:"Dreamy smocked prairie dress with puffed sleeves and floral print. Perfect for garden parties and countryside strolls.",
    tags:["Cottagecore","Prairie","Pastel","Smocked","Whimsical"]
  }
];

let filteredOutfits = [...outfits];
let selectedOccasion = 'All';
let selectedTryOnOutfit = null;
let uploadedPhotoURL = null;
let currentModalOutfit = null;

// ─── RENDER OUTFITS ────────────────────────────────────────────────
function starRating(r) {
  const full = Math.floor(r);
  let s = '';
  for(let i=0;i<5;i++) s += i < full ? '★' : '☆';
  return s;
}

function renderOutfits(list) {
  const grid = document.getElementById('outfits-grid');
  const none = document.getElementById('no-results');
  grid.innerHTML = '';
  if(!list.length) { none.style.display='block'; return; }
  none.style.display='none';
  list.forEach((o,idx) => {
    const card = document.createElement('div');
    card.className = 'outfit-card';
    card.style.animationDelay = (idx*0.05)+'s';
    card.innerHTML = `
      <div class="outfit-placeholder">
        <span style="font-size:80px">${o.emoji}</span>
        <div class="outfit-badges">
          <span class="badge badge-occasion">${o.occasion}</span>
          <span class="badge badge-weather">${o.weather.split(' ')[0]}</span>
          ${idx < 3 ? '<span class="badge badge-hot">🔥 Hot</span>' : ''}
        </div>
        <button class="outfit-tryon-btn" onclick="event.stopPropagation();quickTryOn(${o.id})">🪞 Try On</button>
      </div>
      <div class="outfit-info">
        <div class="outfit-name">${o.name}</div>
        <div class="outfit-brand">${o.brand} · ${o.store}</div>
        <div class="outfit-meta">
          <span class="meta-tag">${o.gender}</span>
          <span class="meta-tag">${o.style}</span>
          <span class="meta-tag">${o.color.split('(')[0].trim()}</span>
        </div>
        <div class="outfit-footer">
          <div>
            <div class="outfit-price">
              <span class="old">$${o.oldPrice}</span>$${o.price}
            </div>
            <div class="rating">${starRating(o.rating)} <span style="color:var(--muted);font-size:12px;">(${o.reviews.toLocaleString()})</span></div>
          </div>
          <a class="buy-btn" href="${o.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Shop →</a>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openModal(o));
    grid.appendChild(card);
  });
  buildTryOnChips(list);
}

// ─── FILTERS ──────────────────────────────────────────────────────
function selectChip(el, group) {
  document.querySelectorAll('#occasion-chips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedOccasion = el.textContent;
  applyFilters();
}

function applyFilters() {
  const loading = document.getElementById('ai-loading');
  loading.classList.add('show');
  document.getElementById('outfits-grid').style.opacity = '0.3';
  setTimeout(() => {
    const gender = document.getElementById('f-gender').value;
    const weather = document.getElementById('f-weather').value;
    const color = document.getElementById('f-color').value;
    const style = document.getElementById('f-style').value;
    const store = document.getElementById('f-store').value;
    const budget = document.getElementById('f-budget').value;
    const search = document.getElementById('search-input').value.toLowerCase();

    filteredOutfits = outfits.filter(o => {
      if(gender && o.gender !== gender) return false;
      if(weather && o.weather !== weather && o.weather !== 'Any') return false;
      if(color && o.color !== color) return false;
      if(style && o.style !== style) return false;
      if(store && o.store !== store) return false;
      if(selectedOccasion && selectedOccasion !== 'All' && o.occasion !== selectedOccasion) return false;
      if(budget) {
        if(budget==='Under $30' && o.price >= 30) return false;
        if(budget==='$30 – $80' && (o.price < 30 || o.price > 80)) return false;
        if(budget==='$80 – $150' && (o.price < 80 || o.price > 150)) return false;
        if(budget==='$150 – $300' && (o.price < 150 || o.price > 300)) return false;
        if(budget==='$300+' && o.price < 300) return false;
      }
      if(search && !o.name.toLowerCase().includes(search) && !o.desc.toLowerCase().includes(search) && !o.tags.some(t=>t.toLowerCase().includes(search))) return false;
      return true;
    });

    const sort = document.getElementById('f-sort').value;
    if(sort === 'Price: Low to High') filteredOutfits.sort((a,b)=>a.price-b.price);
    else if(sort === 'Price: High to Low') filteredOutfits.sort((a,b)=>b.price-a.price);
    else if(sort === 'Top Rated') filteredOutfits.sort((a,b)=>b.rating-a.rating);

    loading.classList.remove('show');
    document.getElementById('outfits-grid').style.opacity = '1';
    renderOutfits(filteredOutfits);
  }, 600);
}

// ─── MODAL ────────────────────────────────────────────────────────
function openModal(o) {
  currentModalOutfit = o;
  document.getElementById('modal-img').innerHTML = `<span style="font-size:90px">${o.emoji}</span>`;
  document.getElementById('modal-brand').textContent = o.brand + ' · ' + o.store;
  document.getElementById('modal-title').textContent = o.name;
  document.getElementById('modal-desc').textContent = o.desc;
  document.getElementById('modal-price').innerHTML = `<span style="font-size:18px;color:var(--muted);text-decoration:line-through;margin-right:10px;font-size:16px;">$${o.oldPrice}</span>$${o.price}`;
  document.getElementById('modal-rating').innerHTML = `${starRating(o.rating)} <span style="color:var(--muted);font-size:13px;">${o.rating} · ${o.reviews.toLocaleString()} reviews</span>`;
  const tagsEl = document.getElementById('modal-tags');
  tagsEl.innerHTML = o.tags.map(t=>`<span class="meta-tag">${t}</span>`).join('');
  document.getElementById('modal-buy').href = o.link;
  document.getElementById('modal-buy').textContent = `Shop on ${o.store} →`;
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalCheck(e) {
  if(e.target === document.getElementById('modal')) closeModal();
}

function launchTryOn() {
  closeModal();
  document.getElementById('tryon').scrollIntoView({behavior:'smooth'});
  if(currentModalOutfit) {
    setTimeout(() => {
      document.querySelectorAll('.tryon-outfit-chip').forEach(c => {
        if(c.dataset.id == currentModalOutfit.id) {
          c.click();
        }
      });
    }, 600);
  }
}

// ─── VIRTUAL TRY-ON ───────────────────────────────────────────────
function buildTryOnChips(list) {
  const container = document.getElementById('tryon-chips');
  container.innerHTML = '';
  (list.length ? list : outfits).slice(0,6).forEach(o => {
    const chip = document.createElement('div');
    chip.className = 'tryon-outfit-chip';
    chip.textContent = o.emoji + ' ' + o.name.split(' ').slice(0,3).join(' ');
    chip.dataset.id = o.id;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.tryon-outfit-chip').forEach(c=>c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedTryOnOutfit = o;
    });
    container.appendChild(chip);
  });
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    uploadedPhotoURL = e.target.result;
    const box = document.getElementById('upload-box');
    const preview = document.getElementById('upload-preview');
    box.querySelector('.upload-icon').style.display = 'none';
    box.querySelector('.upload-title').style.display = 'none';
    box.querySelector('.upload-hint').style.display = 'none';
    preview.src = uploadedPhotoURL;
    preview.style.display = 'block';
    box.classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

function generateTryOn() {
  if(!uploadedPhotoURL) {
    alert('Please upload a photo first! 📸');
    return;
  }
  if(!selectedTryOnOutfit) {
    alert('Please select an outfit to try on! 👗');
    return;
  }

  const loading = document.getElementById('tryon-loading');
  const resultBox = document.getElementById('tryon-result');
  const info = document.getElementById('tryon-info');
  const placeholder = resultBox.querySelector('.tryon-placeholder');

  loading.style.display = 'block';
  info.style.display = 'none';

  // Simulate AI processing
  setTimeout(() => {
    loading.style.display = 'none';
    placeholder.innerHTML = `
      <div style="font-size:80px;margin-bottom:12px;">${selectedTryOnOutfit.emoji}</div>
      <div style="font-size:48px;margin-bottom:12px;">👤</div>
      <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:8px;">Virtual Try-On Ready!</div>
      <div style="font-size:13px;color:var(--muted);max-width:280px;margin:0 auto;">
        AI overlay applied. In production, this integrates with a real try-on API (e.g. Revery AI, ZMO.ai, or TryOn.ai) to show the outfit on your uploaded photo.
      </div>
      <div style="margin-top:16px;padding:12px 20px;background:rgba(201,169,110,0.1);border:1px solid rgba(201,169,110,0.2);border-radius:10px;font-size:13px;color:var(--accent2);">
        ✦ To enable real try-on, connect a try-on API key in settings.
      </div>
    `;
    document.getElementById('tryon-outfit-name').textContent = selectedTryOnOutfit.name;
    document.getElementById('tryon-outfit-price').textContent = '$' + selectedTryOnOutfit.price;
    document.getElementById('tryon-buy-link').href = selectedTryOnOutfit.link;
    document.getElementById('tryon-buy-link').textContent = 'Shop on ' + selectedTryOnOutfit.store + ' →';
    info.style.display = 'block';
  }, 2200);
}

function quickTryOn(id) {
  const outfit = outfits.find(o=>o.id===id);
  if(!outfit) return;
  document.getElementById('tryon').scrollIntoView({behavior:'smooth'});
  setTimeout(()=>{
    document.querySelectorAll('.tryon-outfit-chip').forEach(c=>{
      c.classList.remove('selected');
      if(c.dataset.id == id) { c.classList.add('selected'); selectedTryOnOutfit = outfit; }
    });
  }, 600);
}

// ─── INIT ─────────────────────────────────────────────────────────
renderOutfits(outfits);
buildTryOnChips(outfits);
