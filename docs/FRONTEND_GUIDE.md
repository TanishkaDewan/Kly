# KLYRO — Frontend Architecture & UI Guide (`/docs/FRONTEND_GUIDE.md`)

> **Frontend Architecture, UI/UX & Component Taxonomy Guide**  
> **Primary Owner**: Member 1 (Frontend)  
> **Tech Stack**: React 18, Vite, Tailwind CSS, Lucide React Icons, React Router v6

---

## 1. Overview & UI Design Aesthetics

The KLYRO frontend is designed as a futuristic, high-intensity gaming cockpit for software engineering competitions. It utilizes a sleek dark-mode palette, glowing cyan/purple accent gradients, dynamic battle timers, and responsive HUD panels.

---

## 2. Directory & Component Structure

```
frontend/
├── index.html            # Main HTML entry point & viewport meta
├── vite.config.js        # Vite bundler configuration
├── tailwind.config.js    # Custom Klyro color tokens & theme extensions
├── src/
│   ├── main.jsx          # React app entry root
│   ├── App.jsx           # Master route router & layout shell
│   ├── index.css         # Global Tailwind directives & glassmorphism classes
│   ├── context/          # React Context (Auth Context, Battle Context)
│   ├── pages/            # Top-level Page Views
│   │   ├── HomePage.jsx          # Landing hero, feature pitch, CTA
│   │   ├── ArenaPage.jsx         # Live Battle Cockpit HUD, task specs, editor
│   │   ├── BattleResultsPage.jsx # AI evaluation breakdown, rank, score cards
│   │   ├── LeaderboardPage.jsx   # Global player rankings, XP, win streaks
│   │   ├── ProfilePage.jsx       # Player statistics, match history, badges
│   │   ├── HowItWorksPage.jsx    # Arena rules, scoring dimensions, team guide
│   │   └── ShowcasePage.jsx      # Top submitted projects gallery
│   └── components/       # Reusable UI Elements
│       ├── Navbar.jsx            # Top navigation header & user profile status
│       ├── Footer.jsx            # Platform links & copyright
│       ├── HUDTimer.jsx          # Battle countdown clock
│       ├── ScoreRadarChart.jsx   # 6-dimension evaluation visualizer
│       └── CodeSnippetViewer.jsx # Syntax highlighted snippet display
```

---

## 3. Application Route Map

| URL Path | React Component | Access Guard | Description |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage.jsx` | Public | Platform landing page with hero banner and battle entrance. |
| `/how-it-works` | `HowItWorksPage.jsx` | Public | Explanation of scoring dimensions, matchmaking, and rules. |
| `/arena` | `ArenaPage.jsx` | Authenticated | Live 6-week software battle cockpit, active task requirements. |
| `/battle-results` | `BattleResultsPage.jsx` | Authenticated | Comprehensive post-battle evaluation report & AI feedback. |
| `/leaderboard` | `LeaderboardPage.jsx` | Public | Global player leaderboard sorted by ELO rating and total XP. |
| `/profile` | `ProfilePage.jsx` | Authenticated | User profile, GitHub sync status, achievement badges. |
| `/showcase` | `ShowcasePage.jsx` | Public | Featured community battle submissions and hall of fame. |

---

## 4. State Management Architecture

- **Auth Context (`AuthContext.jsx`)**: Manages Supabase user session, JWT token persistence, and profile metadata.
- **Battle State**: Tracks active challenge ID, team consent statuses, live battle timer countdown, and submission repo URL state.

---

## 5. UI Theme Tokens (Tailwind Config)

- **Primary Dark Background**: `#0f172a` (Slate 900) / `#090d16` (Cockpit Dark)
- **Primary Accent**: `#06b6d4` (Cyan Glow)
- **Secondary Accent**: `#8b5cf6` (Purple Neon)
- **Success / Winner**: `#10b981` (Emerald)
- **Warning / Timer Alert**: `#f59e0b` (Amber)
