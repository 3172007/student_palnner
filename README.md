# 📚 Student Study Planner

A modern, responsive, and intuitive **Student Study Planner web application** designed for college students to organize study tasks, manage priorities, track deadlines, and monitor overall academic progress in real-time.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## ✨ Features

- 📋 **Study Task Management**: Easily create, organize, mark complete, and delete study tasks.
- 🌲 **Subject Categorization**: Categorize tasks by subjects (*Data Structures, Java, Python, DBMS, Computer Networks, Operating Systems, Web Development, and Other*).
- 🔥 **Priority Levels**: Color-coded High, Medium, and Low priority badges.
- ⏰ **Due Date & Overdue Alerts**: Real-time due date tracking with automatic overdue detection (`⚠️ Overdue` / `⏰ Due Today`).
- 📊 **Dynamic Dashboard Summary**: Live updating counters for **Total Tasks**, **Completed**, **Pending**, and **Progress Rate %**.
- 🎯 **Animated Progress Tracker**: Visual progress bar with animated gradient shimmer indicating task completion ratio.
- 🔍 **Real-Time Filters & Search**: Filter by completion status (*All, Pending, Completed*), subject dropdown, or instant keyword search.
- 🌓 **Dark / Light Theme Toggle**: Seamless dark mode support with local persistence.
- 💾 **Persistent Browser Storage**: Automatically saves all tasks and theme settings to `localStorage`.
- 📱 **Fully Responsive Design**: Optimized for desktops, laptops, tablets, and mobile screens.

---

## 🛠️ Tech Stack

- **HTML5**: Semantic document structure & accessibility.
- **CSS3**: Custom design system, CSS variables, glassmorphism, flexbox/grid layout, and smooth micro-animations.
- **Vanilla JavaScript (ES6+)**: Pure client-side DOM manipulation, event delegation, and state management without external dependencies or frameworks.

---

## 🚀 Getting Started

### Option 1: Direct File Launch
Simply clone or download this repository and double-click `index.html` in your file browser.

### Option 2: Run with Local Server
```bash
# Clone the repository
git clone https://github.com/3172007/student_palnner.git

# Navigate to the project directory
cd student_palnner

# Start a lightweight local server (Python)
python -m http.server 8080

# Or with Node.js
npx serve .
```
Then open `http://localhost:8080` in your web browser.

---

## 📂 Project Structure

```
├── index.html        # Main HTML entrypoint & UI layout
├── style.css         # Modern styling, theme tokens & responsive rules
├── script.js         # Core application logic, filters & storage
└── README.md         # Project documentation
```

---

## 🎓 Author

Created for college study planning and workshop demonstrations.
