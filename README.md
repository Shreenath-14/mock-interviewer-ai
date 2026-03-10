# 🎙️ MockInterviewer - AI-Powered Mock Interview Platform

[![Build Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com/yourusername/MockInterviewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: React + Flask](https://img.shields.io/badge/Stack-React%20%7C%20Flask-blue)](https://github.com/yourusername/MockInterviewer)

MockInterviewer is an advanced, AI-driven platform designed to help job seekers master their interview skills. By combining Google's Gemini Pro AI with real-time face tracking and voice synthesis, it provides a realistic, interactive, and feedback-rich interview experience.

---

## 🚀 Key Features

*   **🤖 AI Recruiter:** Context-aware interview sessions powered by **Google Gemini Pro**.
*   **📄 Resume Intelligence:** Upload your PDF resume; the AI automatically parses it to tailor questions specifically to your background.
*   **🎤 Voice Interaction:** Natural and realistic interview flow using **Edge-TTS** for seamless speech synthesis.
*   **👤 Real-time Face Tracking:** Integrated **face-api.js** to monitor presence and engagement during the session.
*   **📊 Comprehensive Dashboard:** Track your interview history, view detailed performance reports, and monitor progress over time.
*   **✨ Modern UI/UX:** A responsive and sleek interface built with **React 19** and **Tailwind CSS 4**.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4, Lucide React
- **ML/Computer Vision:** face-api.js
- **Routing & State:** React Router, Axios
- **Extras:** React Confetti, React Webcam

### Backend
- **Framework:** Flask (Python)
- **Database:** MongoDB (PyMongo)
- **AI Engine:** Google Generative AI (Gemini Pro)
- **Voice:** Edge-TTS
- **Parsing:** PyPDF

---

## 🏁 Getting Started

### Prerequisites
- **Node.js:** v18.x or higher
- **Python:** v3.10 or higher
- **MongoDB:** Local installation or MongoDB Atlas URI

### 📥 Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Shreenath-14/mock-interviewer-ai.git
   cd MockInterviewer
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend` directory and add the following:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/mockinterviewer

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key

# Security
SECRET_KEY=your_flask_secret_key

# Optional: ElevenLabs (if used for higher-quality voices)
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_voice_id
```

---

## 📖 Usage

### 1. Start the Backend
```bash
cd backend
python app.py
```
The API will be available at `http://localhost:5000`.

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🏗️ System Architecture

MockInterviewer follows a decoupled client-server architecture:
- **Client Layer:** The React application handles camera input, face detection, and user interaction.
- **Service Layer:** Flask routes handle resume processing, AI prompt engineering, and audio generation.
- **AI/Data Layer:** MongoDB stores user data and interview history, while external APIs (Gemini, Edge-TTS) power the intelligence and voice of the recruiter.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact

**Shreenath** - [LinkedIn](https://linkedin.com/in/yourusername) - [Portfolio](https://yourportfolio.com)

Project Link: [https://github.com/Shreenath-14/mock-interviewer-ai.git](https://github.com/Shreenath-14/mock-interviewer-ai.git)
