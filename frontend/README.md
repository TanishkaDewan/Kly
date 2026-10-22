# KLYRO — Frontend (`/frontend`)

> **Owner**: Member 1  
> **Tech Stack**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router DOM  
> **Deployment Target**: Vercel  

---

## 🚀 Quick Start (Local Setup)

To run the frontend locally on your machine:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Once started, open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 📂 Directory Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI widgets (Navbar, Footer, Hero, AuthModal, CanvasBackdrop, etc.)
│   ├── context/          # Global application state (AuthContext)
│   ├── pages/            # View routes (HomePage, ArenaPage, LeaderboardPage, HowItWorksPage, etc.)
│   ├── App.jsx           # App shell with React Router & theme overlays
│   ├── index.css         # Tailwind directives, liquid glass styling & animations
│   └── main.jsx          # Vite React root mount
├── index.html            # Google Fonts (Inter, Plus Jakarta Sans, Instrument Serif, JetBrains Mono)
├── tailwind.config.js    # Custom brand tokens & typography config
├── vite.config.js        # Vite bundler & dev server config
├── vercel.json           # Client-side SPA routing rewrites for Vercel
└── .env.example          # Environment variables template
```

---

## 🌐 Connecting to Backend

In `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```
When Member 2 deploys the Express backend on Render, update this to your Render production URL:
```env
VITE_API_BASE_URL=https://klyro-backend.onrender.com
```
