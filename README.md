# 🧮 Weapon of Math Destruction – Dev 5 Project

## 📌 Project Overview
This project is a **Weapon of Math Destruction** application developed for the Dev 5 course.  
The system collects detailed, user-level data and uses this data to **visualize behavior, detect patterns, and subtly influence user decisions**.

The application focuses on tracking user interactions and dog health data, combining analytics with behavioral insights.

---

## 🧩 Project Structure

The project consists of four main parts:

### 1. User-facing application
- React frontend (Vite)
- Users log daily data about their dog
- User behavior is influenced through insights, tips, and visual feedback
- Navigation, hover behavior, and interaction data are tracked

### 2. Backend
- Node.js + Express
- MongoDB for persistent storage
- Tracks:
  - Users (UID-based)
  - Sessions (logins, durations, page views)
  - Analytics events (clicks, hovers, navigation)
  - Dog health logs

### 3. Admin dashboard
- Accessible through a protected admin route
- Allows administrators to:
  - View all users
  - Select individual users
  - Analyze sessions, interactions, and dog data
  - Detect trends and make decisions based on collected data

### 4. Written reflection
- Discusses outcomes, insights, and shortcomings
- Reflects on data reliability, bias, and ethical concerns
- Explains how collected data can influence user behavior

---

## 📊 Data Collection
The system collects data on an **individual user level**, including:
- Login and session duration
- Page views and navigation
- Hovered elements and interactions
- Dog health metrics (emotion, sleep, water, walks)

All data is linked to a unique user ID and stored persistently.

---

## 🐳 Running the Project

### Requirements
- Docker
- Docker Compose
- `.env` file (see `.env.template`)

### Run locally
```bash
docker compose up --build


🔗 Sources & References
Documentation

React
https://react.dev/

Vite
https://vitejs.dev/

Node.js
https://nodejs.org/

Express
https://expressjs.com/

MongoDB
https://www.mongodb.com/docs/

Charts & Visualization

Chart.js
https://www.chartjs.org/docs/latest/

react-chartjs-2
https://react-chartjs-2.js.org/

Web Analytics & UX

MDN Web Docs (events, browser APIs)
https://developer.mozilla.org/

UX nudging & dark patterns
https://www.deceptive.design/

Docker

Docker Docs
https://docs.docker.com/

Docker Compose
https://docs.docker.com/compose/

AI Tool

ChatGPT (OpenAI)
https://chat.openai.com/