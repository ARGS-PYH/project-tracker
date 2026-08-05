# TaskForge — General-Purpose Project & Launch Tracker

TaskForge is a custom, real-time project management and launch tracking application designed for fast-moving teams. Create a self-contained workspace for any project, set a deadline date with a live countdown timer, and collaborate with your team using private PIN authentication.

## 🚀 Features

- **Instant Workspace Creation**: Anyone can spin up a project workspace in 30 seconds with a shareable link.
- **PIN-based Team Authentication**: Member-specific PIN access. First-time team members choose their own PIN when logging in.
- **Shared Team Tasks**: Organized into Phases with real-time checkbox sync via Firebase Firestore.
- **Private Personal Tasks**: Each member has their own private to-do list within the project that only they can see.
- **Dynamic Edit Mode**: Easily add, update, or remove phases and tasks dynamically without losing checkbox progress.
- **Live Launch Countdown**: Real-time ticking countdown timer to the target project deadline.
- **Live Presence Indicator**: See active team members who are online in the workspace.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Vanilla CSS (Design Tokens)
- **Real-Time Sync & Hosting**: Firebase Firestore & Firebase Hosting
- **Backend API**: Node.js, Express (Deployed on Render)

## 📦 Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ARGS-PYH/project-tracker.git
   cd project-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Run Express backend server:
   ```bash
   npm start
   ```

## 📄 License

MIT
