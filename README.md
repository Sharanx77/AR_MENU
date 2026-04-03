# THE OG CAFE! 🍽️✨
**An AI-Powered Augmented Reality Dining Experience**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini API](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

[LIVE LINK](https://armenu-lilac.vercel.app/)

THE OG CAFE! is a full-stack, mobile-first WebAR application that redefines the digital menu. By merging **Augmented Reality (AR.js/A-Frame)** with **Generative AI (Google Gemini 2.5 Flash)**, it allows users to project 3D artisan food models into their physical space, scan them for real-time nutritional insights, and customize their orders using natural voice commands. 

Built to eliminate friction in hospitality and elevate the visual dining experience.

---

## 🌟 Key Innovations

* **Interactive 3D AR Previews:** View high-fidelity `.glb` food models anchored to physical markers. Includes custom-built touch physics for 360-degree rotation (swipe) and dynamic scaling (pinch-to-zoom) natively in the browser.
* **AI "X-Ray" Nutritional Scanner:** A secure Express.js backend queries Google's Gemini AI to instantly generate realistic macronutrients (Calories/Protein) and dynamic trivia based on the specific ingredients of the active 3D model, displayed in a glassmorphic HUD.
* **Voice-to-Ticket NLP Engine:** Utilizes the native Web Speech API to capture user modifications via voice. The AI backend seamlessly sanitizes messy human speech into professional, 4-word kitchen tickets (e.g., *"No Onions, Extra Spicy"*).
* **Secure MERN Architecture:** Completely decoupled client and server. API keys remain 100% hidden on the backend, while MongoDB Atlas permanently stores dynamic menu configurations and incoming kitchen orders.
* **Premium UI/UX Engine:** Features a dual-filtering system (dietary + text search), custom dark/light glassmorphic theme engine, and `framer-motion` staggered page transitions.

---

## 🛠️ System Architecture

**Frontend (Client Layer):**
* React.js (Vite)
* Tailwind CSS (Glassmorphism & Responsive Design)
* Framer Motion (State-driven Animations)
* Web Speech API (Voice Recognition)

**AR Engine (Render Layer):**
* AR.js & A-Frame (WebAR & WebGL 3D Rendering)

**Backend (Logic & AI Layer):**
* Node.js & Express.js (RESTful API)
* Google Generative AI SDK (Gemini 2.5 Flash NLP & Data Extraction)
* CORS & dotenv (Security)

**Database (Storage Layer):**
* MongoDB Atlas & Mongoose (Cloud Data Persistence)

---
