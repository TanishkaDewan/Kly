import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CanvasBackdrop from './components/CanvasBackdrop';
import GridLines from './components/GridLines';
import GlowEffect from './components/GlowEffect';

// Pages
import HomePage from './pages/HomePage';
import ArenaPage from './pages/ArenaPage';
import LeaderboardPage from './pages/LeaderboardPage';
import HowItWorksPage from './pages/HowItWorksPage';
import BattleResultsPage from './pages/BattleResultsPage';
import ShowcasePage from './pages/ShowcasePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

// Scroll to top helper on route navigation
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="relative min-h-screen bg-[#0f172a] text-white overflow-x-hidden selection:bg-[#22d3ee]/30 selection:text-[#22d3ee] flex flex-col justify-between">
          {/* 1. Base Animated Canvas / Grid Drift */}
          <CanvasBackdrop />

          {/* 2. Desktop Grid Lines (25%, 50%, 75%) */}
          <GridLines />

          {/* 3. Central Top SVG Glow (Cyan -> Indigo with 25px Blur) */}
          <GlowEffect />

          {/* 4. Left-to-Right Dark Gradient Overlay (#070b12 to transparent) */}
          <div 
            className="absolute inset-y-0 left-0 w-full md:w-1/2 pointer-events-none z-[1] bg-gradient-to-r from-[#070b12] via-[#070b12]/60 to-transparent" 
            aria-hidden="true" 
          />

          {/* 5. Bottom-Up Dark Gradient Overlay (for readability) */}
          <div 
            className="absolute inset-x-0 bottom-0 h-96 pointer-events-none z-[1] bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent" 
            aria-hidden="true" 
          />

          {/* 6. Top Vignette Overlay */}
          <div 
            className="absolute inset-x-0 top-0 h-40 pointer-events-none z-[1] bg-gradient-to-b from-[#070b12]/80 to-transparent" 
            aria-hidden="true" 
          />

          {/* 7. Global Sticky Navigation */}
          <Navbar />

          {/* 8. Main Application Routes */}
          <main className="relative z-10 flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/arena" element={<ArenaPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/results" element={<BattleResultsPage />} />
              <Route path="/showcase" element={<ShowcasePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              {/* Fallback route */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>

          {/* 9. Global Auth Modal */}
          <AuthModal />

          {/* 10. Global Footer */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
