// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Change this to your Render backend URL after deployment
const API_BASE = 'https://tryonix-api.onrender.com/api';
// For local dev: const API_BASE = 'http://localhost:5000/api';

// ─── STATE ────────────────────────────────────────────────────────────────────
let allOutfits = [];
let selectedOccasion = 'All';
let selectedTryOnOutfit = null;
let currentModalOutfit = null;

// ─── FETCH OUTFITS ────────────────────────────────────────────────────────────
async function fetchOutfits(params = {}) {
  showLoading(true);
  hideNoResults();

  const query = new URLSearchParams();
  if (params.gender)    query.set('gender', params.gender);
  if (params.occasion && params.occasion !== 'All') query.set('occasion', params.occasion);
  if (params.season)    query.set('season', params.season);
  if (params.color)     query.set('color', params.color);
  if (params.style)     query.set('style', params.style);
  if (params.bodyType)  query.set('bodyType', params.bodyType);
  if (params.store)     query.set('store', params.store);
  if (params.budget)    query.set('budget', params.budget);
  if (params.search)    query.set('search', params.search);
  if (params.sort)      query.set('sort', params.sort);
  query.set('limit', '80');

  try {
    const res = await fetch(`${API_BASE}/outfits?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allOutfits = data.data || [];
    renderOutfits(allOutfits);
    populateTryOnChips(allOutfits.slice(0, 12));
  } catch (err) {
    console.error('Failed to fetch outfits:', err);
    showError();
  } finally {
    showLoading(false);
  }
}

// ─── RENDER OUTFIT CARDS ──────────────────────────────────────────────────────
function renderOutfits(outfits) {
  const grid = document.getElementById('outfits-grid');
  const noResults = document.getElementById('no-results');

  if (!outfits || outfits.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';
  grid.innerHTML = outfits.map(outfit => createOutfitCard(outfit)).join('');
}

function createOutfitCard(outfit) {
  const stars = generateStars(outfit.rating);
  const discount = outfit.originalPrice
    ? Math.round(((outfit.originalPrice - outfit.price) / outfit.originalPrice) * 100)
    : null;

  return `
    <div class="outfit-card" onclick="openModal('${outfit._id}')">
      <div style="position:relative;">
        ${outfit.imageUrl
          ? `<img class="outfit-img" src="${outfit.imageUrl}" alt="${outfit.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
             <div class="outfit-placeholder" style="display:none;">${outfit.emoji || '👗'}</div>`
          : `<div class="outfit-placeholder">${outfit.emoji || '👗'}</div>`
        }
        <div class="outfit-badges">
          ${outfit.occasion && outfit.occasion[0]
            ? `<span class="badge badge-occasion">${outfit.occasion[0]}</span>` : ''}
          ${outfit.isTrending ? '<span class="badge badge-hot">🔥 Trending</span>' : ''}
          ${outfit.isNew ? '<span class="badge badge-weather">✨ New</span>' : ''}
          ${discount ? `<span class="badge" style="background:rgba(92,200,176,0.2);color:#5cc8b0;border:1px solid rgba(92,200,176,0.3);">${discount}% OFF</span>` : ''}
        </div>
        <button class="outfit-tryon-btn" onclick="event.stopPropagation(); quickTryOn('${outfit._id}')">
          🪞 Try On
        </button>
      </div>
      <div class="outfit-info">
        <div class="outfit-name">${outfit.name}</div>
        <div class="outfit-brand">${outfit.brand} · ${outfit.store}</div>
        <div class="outfit-meta">
          <span class="meta-tag">${outfit.gender}</span>
          ${outfit.stylePreference ? `<span class="meta-tag">${outfit.stylePreference}</span>` : ''}
          ${outfit.season && outfit.season[0] ? `<span class="meta-tag">${outfit.season[0]}</span>` : ''}
        </div>
        <div class="outfit-footer">
          <div class="outfit-price">
            ${outfit.originalPrice ? `<span class="old">₹${outfit.originalPrice.toLocaleString('en-IN')}</span>` : ''}
            ₹${outfit.price.toLocaleString('en-IN')}
          </div>
          <a class="buy-btn" href="${outfit.buyLink}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Shop →</a>
        </div>
        <div class="rating">
          ${stars} <span style="color:var(--muted);font-size:12px;">(${outfit.reviewCount || 0})</span>
        </div>
      </div>
    </div>
  `;
}

function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ─── FILTERS ──────────────────────────────────────────────────────────────────
function getFilterValues() {
  return {
    gender:    (document.getElementById('f-gender')  || {}).value || '',
    season:    (document.getElementById('f-season')  || {}).value || '',
    color:     (document.getElementById('f-color')   || {}).value || '',
    style:     (document.getElementById('f-style')   || {}).value || '',
    bodyType:  (document.getElementById('f-body')    || {}).value || '',
    budget:    (document.getElementById('f-budget')  || {}).value || '',
    store:     (document.getElementById('f-store')   || {}).value || '',
    sort:      (document.getElementById('f-sort')    || {}).value || 'Trending',
    search:    (document.getElementById('search-input') || {}).value || '',
    occasion:  selectedOccasion
  };
}

function applyFilters() {
  const filters = getFilterValues();
  fetchOutfits(filters);
}

function selectChip(el, group) {
  document.querySelectorAll(`#${group}-chips .chip`).forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (group === 'occasion') selectedOccasion = el.textContent.trim();
  applyFilters();
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
async function openModal(id) {
  const outfit = allOutfits.find(o => o._id === id);
  if (!outfit) return;
  currentModalOutfit = outfit;

  document.getElementById('modal-brand').textContent = outfit.brand + ' · ' + outfit.store;
  document.getElementById('modal-title').textContent = outfit.name;
  document.getElementById('modal-desc').textContent = outfit.description || '';
  document.getElementById('modal-price').textContent = '₹' + outfit.price.toLocaleString('en-IN');
  document.getElementById('modal-buy').href = outfit.buyLink;
  document.getElementById('modal-rating').innerHTML =
    generateStars(outfit.rating) +
    `<span style="color:var(--muted);font-size:12px;margin-left:4px;">${outfit.rating}/5 (${outfit.reviewCount} reviews)</span>`;

  const imgSide = document.getElementById('modal-img');
  imgSide.innerHTML = outfit.imageUrl
    ? `<img src="${outfit.imageUrl}" alt="${outfit.name}" style="width:100%;height:100%;object-fit:cover;border-radius:24px 0 0 24px;" onerror="this.outerHTML='<span style=font-size:80px>${outfit.emoji || '👗'}</span>'" />`
    : `<span style="font-size:80px;">${outfit.emoji || '👗'}</span>`;

  const tags = [
    ...(outfit.occasion || []),
    outfit.stylePreference,
    outfit.color,
    outfit.gender,
    ...(outfit.tags || []).slice(0, 3)
  ].filter(Boolean);
  document.getElementById('modal-tags').innerHTML = tags
    .map(t => `<span class="meta-tag">${t}</span>`).join('');

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalCheck(e) {
  if (e.target.id === 'modal') closeModal();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function launchTryOn() {
  closeModal();
  if (currentModalOutfit) {
    selectTryOnOutfit(currentModalOutfit._id);
  }
  document.getElementById('tryon').scrollIntoView({ behavior: 'smooth' });
}

// ─── VIRTUAL TRY-ON ───────────────────────────────────────────────────────────
function populateTryOnChips(outfits) {
  const container = document.getElementById('tryon-chips');
  if (!container) return;
  container.innerHTML = outfits.map(o => `
    <button class="tryon-outfit-chip" data-id="${o._id}" onclick="selectTryOnOutfit('${o._id}')">
      ${o.emoji || '👗'} ${o.name.split(' ').slice(0, 3).join(' ')}
    </button>
  `).join('');
}

function selectTryOnOutfit(id) {
  selectedTryOnOutfit = allOutfits.find(o => o._id === id) || null;
  document.querySelectorAll('.tryon-outfit-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });
}

function quickTryOn(id) {
  selectTryOnOutfit(id);
  document.getElementById('tryon').scrollIntoView({ behavior: 'smooth' });
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('upload-preview');
    const box = document.getElementById('upload-box');
    preview.src = e.target.result;
    preview.style.display = 'block';
    box.classList.add('has-image');
    box.querySelector('.upload-icon').style.display = 'none';
    box.querySelector('.upload-title').style.display = 'none';
    box.querySelector('.upload-hint').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function generateTryOn() {
  const preview = document.getElementById('upload-preview');
  if (!preview.src || preview.style.display === 'none') {
    alert('Please upload your photo first.');
    return;
  }
  if (!selectedTryOnOutfit) {
    alert('Please select an outfit to try on.');
    return;
  }

  const loading = document.getElementById('tryon-loading');
  const resultImg = document.getElementById('tryon-result-img');
  const placeholder = document.querySelector('.tryon-placeholder');
  const infoBox = document.getElementById('tryon-info');

  loading.style.display = 'block';
  resultImg.style.display = 'none';
  if (placeholder) placeholder.style.display = 'none';
  infoBox.style.display = 'none';

  // Simulate AI try-on (replace with real API call if available)
  setTimeout(() => {
    loading.style.display = 'none';

    // Show outfit image as result
    if (selectedTryOnOutfit.imageUrl) {
      resultImg.src = selectedTryOnOutfit.imageUrl;
      resultImg.style.display = 'block';
    } else {
      if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = `<div style="font-size:64px;">${selectedTryOnOutfit.emoji || '👗'}</div>
          <div style="font-size:16px;font-weight:600;margin-top:12px;">${selectedTryOnOutfit.name}</div>`;
      }
    }

    document.getElementById('tryon-outfit-name').textContent = selectedTryOnOutfit.name;
    document.getElementById('tryon-outfit-price').textContent = '₹' + selectedTryOnOutfit.price.toLocaleString('en-IN');
    document.getElementById('tryon-buy-link').href = selectedTryOnOutfit.buyLink;
    infoBox.style.display = 'block';
  }, 2200);
}

// ─── LOADING / ERROR HELPERS ──────────────────────────────────────────────────
function showLoading(show) {
  const el = document.getElementById('ai-loading');
  if (el) el.classList.toggle('show', show);
}

function hideNoResults() {
  const el = document.getElementById('no-results');
  if (el) el.style.display = 'none';
}

function showError() {
  const grid = document.getElementById('outfits-grid');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted);">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <div style="font-size:18px;font-weight:600;color:var(--text);">Could not load outfits</div>
        <div style="margin:12px 0 24px;">Check your connection or try again.</div>
        <button class="btn-primary" onclick="applyFilters()">Retry</button>
      </div>
    `;
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchOutfits({});
});