// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Change this to your Render backend URL after deployment
const API_BASE = 'https://tryonix.onrender.com/api';
// For local dev: const API_BASE = 'http://localhost:5000/api';

// ─── STATE ────────────────────────────────────────────────────────────────────
let allOutfits = [];
let selectedOccasion = 'All';
let selectedTryOnOutfit = null;
let currentModalOutfit = null;
let currentUser = JSON.parse(localStorage.getItem('tryonix_user') || 'null');
let uploadedPersonFile = null;

// ─── AUTH ─────────────────────────────────────────────────────────────
function getAuthToken() {
  return localStorage.getItem('tryonix_token');
}

function setAuthMessage(message, isError = false) {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.textContent = message || '';
  el.style.color = isError ? '#ff9a9a' : 'var(--muted)';
}

function toggleAuth(show) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.toggle('open', show);
  modal.style.display = show ? 'flex' : 'none';
  if (show) setAuthMessage('');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
  document.getElementById('signup-form').style.display = isLogin ? 'none' : 'block';
  document.getElementById('login-tab').classList.toggle('active', isLogin);
  document.getElementById('signup-tab').classList.toggle('active', !isLogin);
  setAuthMessage('');
}

async function authRequest(path, body) {
  const res = await fetch(`${API_BASE}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data;
}

function saveSession(data) {
  localStorage.setItem('tryonix_token', data.token);
  localStorage.setItem('tryonix_user', JSON.stringify(data.user));
  currentUser = data.user;
  updateAuthUI();
  toggleAuth(false);
}

async function signup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!name || !email || !password) {
    setAuthMessage('Please fill all signup fields.', true);
    return;
  }

  try {
    setAuthMessage('Creating your account...');
    const data = await authRequest('register', { name, email, password });
    saveSession(data);
  } catch (err) {
    setAuthMessage(err.message, true);
  }
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    setAuthMessage('Please enter email and password.', true);
    return;
  }

  try {
    setAuthMessage('Logging you in...');
    const data = await authRequest('login', { email, password });
    saveSession(data);
  } catch (err) {
    setAuthMessage(err.message, true);
  }
}

function logout() {
  localStorage.removeItem('tryonix_token');
  localStorage.removeItem('tryonix_user');
  currentUser = null;
  updateAuthUI();
}

function updateAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) return;

  if (currentUser) {
    authBtn.innerHTML = `
      <a href="#" class="nav-cta" onclick="event.preventDefault(); logout();">
        Logout (${currentUser.name})
      </a>
    `;
  } else {
    authBtn.innerHTML = `
      <a href="#" class="nav-cta" onclick="event.preventDefault(); toggleAuth(true);">
        Login / Signup
      </a>
    `;
  }
}

async function verifySavedSession() {
  const token = getAuthToken();
  if (!token) {
    updateAuthUI();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Session expired');
    const data = await res.json();
    currentUser = data.user;
    localStorage.setItem('tryonix_user', JSON.stringify(data.user));
  } catch (err) {
    localStorage.removeItem('tryonix_token');
    localStorage.removeItem('tryonix_user');
    currentUser = null;
  } finally {
    updateAuthUI();
  }
}

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
  const visibleOutfits = [...outfits];
  if (selectedTryOnOutfit && !visibleOutfits.some(o => o._id === selectedTryOnOutfit._id)) {
    visibleOutfits.unshift(selectedTryOnOutfit);
  }

  container.innerHTML = visibleOutfits.map(o => `
    <button class="tryon-outfit-chip" data-id="${o._id}" onclick="selectTryOnOutfit('${o._id}')">
      ${o.emoji || '👗'} ${o.name.split(' ').slice(0, 3).join(' ')}
    </button>
  `).join('');

  updateSelectedTryOnOutfitUI();
}

function selectTryOnOutfit(id) {
  selectedTryOnOutfit = allOutfits.find(o => o._id === id) || null;
  populateTryOnChips(allOutfits.slice(0, 12));
}

function updateSelectedTryOnOutfitUI() {
  const selectedBox = document.getElementById('selected-tryon-outfit');
  if (!selectedBox) return;

  if (!selectedTryOnOutfit) {
    selectedBox.style.display = 'none';
    selectedBox.innerHTML = '';
    return;
  }

  selectedBox.style.display = 'flex';
  selectedBox.style.alignItems = 'center';
  selectedBox.style.gap = '12px';
  const selectedPrice = Number(selectedTryOnOutfit.price || 0).toLocaleString('en-IN');
  selectedBox.innerHTML = `
    ${selectedTryOnOutfit.imageUrl
      ? `<img src="${selectedTryOnOutfit.imageUrl}" alt="${selectedTryOnOutfit.name}" style="width:54px;height:72px;object-fit:cover;border-radius:8px;" />`
      : `<div style="width:54px;height:72px;display:flex;align-items:center;justify-content:center;background:var(--surface2);border-radius:8px;">${selectedTryOnOutfit.emoji || '👗'}</div>`
    }
    <div style="min-width:0;">
      <div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;">Selected for try-on</div>
      <div style="font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${selectedTryOnOutfit.name}</div>
      <div style="font-size:13px;color:var(--accent);">₹${selectedPrice}</div>
    </div>
  `;

  document.querySelectorAll('.tryon-outfit-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === selectedTryOnOutfit._id);
  });
}

function quickTryOn(id) {
  selectTryOnOutfit(id);
  document.getElementById('tryon').scrollIntoView({ behavior: 'smooth' });
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  uploadedPersonFile = file;
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

function getTryOnImageSource(payload) {
  if (payload?.resultImageDataUrl) return payload.resultImageDataUrl;
  if (payload?.resultImageUrl) return payload.resultImageUrl;

  const data = payload?.data ?? payload;

  if (typeof data === 'string') {
    return data.startsWith('data:') ? data : `data:image/png;base64,${data}`;
  }

  if (Array.isArray(data)) {
    return getTryOnImageSource(data[0]);
  }

  const image =
    data?.url ||
    data?.path ||
    data?.image ||
    data?.generated_image ||
    data?.result ||
    data?.output ||
    data?.[0]?.url ||
    data?.[0]?.path ||
    data?.data;

  if (!image) return '';
  if (typeof image !== 'string') return getTryOnImageSource(image);

  return typeof image === 'string' && !image.startsWith('http') && !image.startsWith('data:')
    ? `data:image/png;base64,${image}`
    : image;
}

function showTryOnFailure(message) {
  const placeholder = document.querySelector('.tryon-placeholder');
  if (!placeholder) return;

  placeholder.style.display = 'block';
  placeholder.innerHTML = `
    <div style="font-size:48px;margin-bottom:12px;">!</div>
    <div style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text);">Try-on failed</div>
    <div style="font-size:14px;">${message}</div>
  `;
}

async function generateTryOn() {
  if (!getAuthToken()) {
    setAuthMessage('Please login to use virtual try-on.', true);
    toggleAuth(true);
    return;
  }

  const preview = document.getElementById('upload-preview');
  if (!uploadedPersonFile || !preview.src || preview.style.display === 'none') {
    alert('Please upload your photo first.');
    return;
  }
  if (!selectedTryOnOutfit) {
    alert('Please select an outfit to try on.');
    return;
  }
  const garmentImageUrl =
    selectedTryOnOutfit.tryOnImageUrl ||
    selectedTryOnOutfit.garmentImageUrl ||
    selectedTryOnOutfit.clothImageUrl ||
    selectedTryOnOutfit.imageUrl;

  if (!garmentImageUrl) {
    alert('This outfit does not have an image for virtual try-on.');
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

  try {
    const formData = new FormData();
    formData.append('person', uploadedPersonFile);
    formData.append('clothUrl', garmentImageUrl);
    formData.append('garmentDescription', selectedTryOnOutfit.name || 'selected outfit');

    const res = await fetch(`${API_BASE}/tryon`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Try-on generation failed');
    }

    const generatedImage = getTryOnImageSource(data);
    if (!generatedImage) {
      throw new Error('The try-on service did not return an image.');
    }

    resultImg.src = generatedImage;
    resultImg.style.display = 'block';
    document.getElementById('tryon-outfit-name').textContent = selectedTryOnOutfit.name;
    document.getElementById('tryon-outfit-price').textContent = '₹' + selectedTryOnOutfit.price.toLocaleString('en-IN');
    document.getElementById('tryon-buy-link').href = selectedTryOnOutfit.buyLink;
    infoBox.style.display = 'block';
  } catch (err) {
    console.error('Try-on failed:', err);
    showTryOnFailure(err.message);
  } finally {
    loading.style.display = 'none';
  }

  return;

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
  verifySavedSession();
  fetchOutfits({});
});
