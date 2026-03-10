# 💻 MockInterviewer Frontend

[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-blue.svg)](https://react.dev/)
[![Build Tool: Vite](https://img.shields.io/badge/Build%20Tool-Vite-646CFF.svg)](https://vitejs.dev/)
[![Styling: Tailwind CSS 4](https://img.shields.io/badge/Styling-Tailwind%20CSS%204-38B2AC.svg)](https://tailwindcss.com/)

This is the React-based frontend for **MockInterviewer**, a sophisticated AI-powered interview platform. It provides the user interface for mock interviews, resume uploading, face tracking, and performance dashboards.

---

## ✨ Features

*   **⚡ Modern Stack:** Built with **React 19** and **Vite** for ultra-fast development and optimized builds.
*   **🎨 Advanced Styling:** Leveraging **Tailwind CSS 4** for a clean, modern, and responsive UI.
*   **📷 Visual Interaction:** Real-time webcam integration via `react-webcam` and facial analysis with `face-api.js`.
*   **🎯 Interactive Dashboard:** Comprehensive views for interview history, resume reviews, and session reports.
*   **🧩 Reusable Components:** A library of modular components for consistent design (Login, Dashboard, Setup, etc.).
*   **🎊 Engaging UX:** Visual feedback including confetti on session completion and dynamic progress tracking.

---

## 🛠️ Tech Stack

- **Core:** React 19, Vite
- **Styling:** Tailwind CSS 4, Lucide React
- **ML/CV:** `face-api.js` for real-time face tracking.
- **Networking:** Axios for API communication.
- **Routing:** React Router v7
- **Development:** ESLint, PostCSS

---

## 🏁 Getting Started

### Prerequisites
- **Node.js:** v18.x or higher
- **npm** or **yarn**

### 📥 Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

---

## ⚙️ Development

To start the development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### Environment Setup
Ensure the backend is running at `http://localhost:5000` (the default configuration in `Axios` requests) for full functionality.

---

## 📁 Directory Structure

- `src/components/`: Reusable UI elements (Buttons, Cards, Modals).
- `src/pages/`: Main application views (Home, Dashboard, Interview Room).
- `src/services/`: API integration and utility services.
- `src/assets/`: Static images and global styles.
- `public/models/`: Pre-trained models for `face-api.js`.

---

## 📝 Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles the application for production.
- `npm run lint`: Runs ESLint to identify code quality issues.
- `npm run preview`: Locally previews the production build.

---

## 📄 License

Part of the MockInterviewer project, distributed under the MIT License.
