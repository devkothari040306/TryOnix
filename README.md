# 👗 TryOnix — Smart Outfit Recommender + Virtual Try-On

TryOnix is a full-stack AI-powered fashion platform that helps users discover outfits based on filters like occasion, style, season, color, and body type, and also preview outfits on their own image using virtual try-on technology.

---

## 🚀 Features

- 🎯 Smart outfit recommendation system
- 🔍 Advanced filters (occasion, season, style, color, body type, store)
- 👗 Outfit browsing with search & sorting
- 🪞 Virtual try-on using AI (user photo + outfit image)
- 🛒 Direct shopping links to popular stores
- 🔥 Trending & new outfit tags
- 🔐 JWT-based authentication (login/register)
- ⚡ Fast REST API with MongoDB

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Multer (file uploads)
- JWT + bcrypt (authentication)
- Axios

### AI Integration
- Hugging Face IDM-VTON model (virtual try-on)

---

## 📦 API Endpoints

### Auth
- `POST /api/auth/register` → Register user  
- `POST /api/auth/login` → Login user  

### Outfits
- `GET /api/outfits` → Get filtered outfits  

### Try-On
- `POST /api/tryon` → Generate virtual try-on result  

---

## ⚙️ Environment Variables

Create a `.env` file in backend root:
