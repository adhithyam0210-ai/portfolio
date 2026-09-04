# ADHITHYA | Software Tester & Full-Stack Developer Portfolio

[![Node.js](https://img.shields.io/badge/Node.js-v16+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/ES6+-Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20External%20NPM-brightgreen?style=flat-square)](#backend-architecture)

> A modern, high-performance personal developer portfolio and content management portal. Features a consumer-tech inspired card interface, light/dark theme engine, zero-dependency REST API backends in both Node.js and Python, and an administrative dashboard with passcode protection.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run with Node.js (Recommended)](#1-run-with-nodejs-recommended)
  - [Run with Python](#2-run-with-python)
  - [Run Standalone (Static Mode)](#3-run-standalone-static-mode)
- [Admin Portal & Management](#admin-portal--management)
- [REST API Reference](#rest-api-reference)
- [Directory Structure](#directory-structure)
- [Data Model](#data-model)
- [Deployment Guide](#deployment-guide)
- [Contact & Profile](#contact--profile)
- [License](#license)

---

## Overview

This repository houses the personal portfolio of **ADHITHYA** — a Software Tester and Full-Stack Developer specializing in:
- **Testing Methodologies:** SDLC, STLC, Manual Testing, Functional Testing, Regression Testing, Defect Life Cycle.
- **Testing & Developer Tools:** Jira, SQL, Postman, Git & GitHub, Agile/Scrum Sprints.
- **Software Engineering:** JavaScript/TypeScript, React, Next.js, Node.js, Python, and scalable RESTful API design.

The website delivers a consumer-tech card UI inspired by modern platforms like Swiggy and Zomato, emphasizing clean information hierarchy, zero emojis, scalable SVG icons, and smooth micro-interactions.

---

## Key Features

### 1. Public Portfolio (`index.html`)
- **Modern Consumer-Tech UI:** Card-based design system with crisp borders, subtle elevation shadows, and hover interactions.
- **Theme Engine:** Built-in Light and Dark modes with instant toggling and `localStorage` state persistence.
- **Dynamic Category Filtering:** Filter projects across *Software Testing*, *Full Stack*, *Frontend*, *Backend & APIs*, and *Developer Tools*.
- **Live Search & Results Counter:** Instantly filter projects by keyword, technology, or title.
- **Structured Sections:**
  - **Hero & About:** Professional bio, current location badge, and avatar display.
  - **Academic Background:** Degree qualifications, testing coursework, and technical foundations.
  - **Featured Projects:** Project preview cards with technology badges, live preview links, and GitHub repository links.
  - **Skills Matrix:** Categorized competencies (Frontend, Backend, Testing & DevOps).
  - **Experience Timeline:** Detailed work history, deliverables, and achievements.
  - **Interactive Contact Hub:** One-click email copy card, direct Gmail composer link, social links, and a message form.

### 2. Administrative Control Center (`admin.html`)
- **Passcode Protected:** Secure PIN login gate (Default PIN: `admin123`) with password visibility toggle.
- **Full CRUD Management:**
  - **Projects:** Add, update, delete projects, manage tags, links, and preview images (supports both URLs and Base64 file uploads).
  - **Profile & Bio:** Edit your name, role, location, tagline, bio, and social handles in real time.
  - **Skills:** Add, modify, or reorganize skill sets and chip tags.
  - **Experience & Education:** Manage work experience and educational background records.
  - **Security & Backups:** Update your admin PIN, export portfolio data as JSON, or import/restore backups.

### 3. Dual-Mode Data Layer (`js/api.js`)
- **Server-Connected Mode:** Automatically connects to the local REST API when served via HTTP (`http://localhost:5000`), persisting all updates to `data/portfolio.json`.
- **Standalone Offline Fallback:** If launched directly from the file system (`file:///`) or hosted on a static host like GitHub Pages, seamlessly falls back to browser `localStorage` and `js/config.js` default data with zero crashes.

---

## Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Semantic HTML5, Vanilla JavaScript (ES6+), CSS3 Variables, SVG Icons |
| **Typography** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) |
| **Cloud Database** | [Supabase](https://supabase.com) (Hosted PostgreSQL with instant REST API & Realtime) |
| **Node.js Backend** | Native Node.js `http`, `fs`, `path`, `url` (**Zero external npm dependencies**) |
| **Local / Cache Storage** | Single-source JSON file database (`data/portfolio.json`), `data/messages.json` + `localStorage` fallback |

---

## Dynamic Multi-Tier Data Architecture

```
                      +-----------------------------+
                      |   Browser Client            |
                      |   index.html / admin.html   |
                      +--------------+--------------+
                                     |
                                     | Unified Data Layer (js/api.js)
                                     v
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
+-------------------------------+             +---------------------------------+
| Tier 1: Cloud Database        |             | Tier 2: Local Server / Fallback |
| (Supabase PostgreSQL)         |             | (Node.js REST API / Cache)      |
| • Instant Live Global Updates |             | • localhost:5000 offline dev    |
| • Contact Inquiries Storage   |             | • data/portfolio.json mirror    |
+-------------------------------+             +---------------------------------+
```

---

## 2-Minute Database Setup (Supabase)

To make your portfolio dynamic so your edits in the Admin Portal reflect live for everyone worldwide:

1. **Create a Free Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and create a free account.
   - Click **New Project** and name it (e.g., `portfolio-db`).

2. **Run the Database Schema:**
   - In your Supabase dashboard, click **SQL Editor** on the left menu.
   - Open [schema.sql](file:///c:/Users/adhit/OneDrive/Desktop/portfolio/schema.sql) from this repository, copy its content, paste it into the Supabase SQL editor, and click **Run**.
   - This creates the `portfolio` and `messages` tables with secure Row Level Security (RLS) policies.

3. **Connect in Admin Portal:**
   - Go to **Project Settings > API** in your Supabase dashboard.
   - Copy your **Project URL** and **anon public key**.
   - Open `admin.html` on your browser, unlock the portal (default PIN: `admin123`), and click the **Database & Cloud** tab.
   - Paste your Project URL and Anon Key, then click **Save & Test Connection**.
   - Click **1-Click Initialize & Seed Database** to upload your current projects and profile directly into PostgreSQL.

Your portfolio is now dynamic! Any edits in the Admin Portal update PostgreSQL within milliseconds, and every visitor on your live site sees your latest changes instantly.

---

## Getting Started

### Prerequisites
- **Node.js** (v16.0 or higher) — *or* **Python** (v3.8 or higher).
- A modern web browser (Chrome, Firefox, Edge, Safari).

---

### 1. Run with Node.js (Recommended)

The Node.js server runs with **zero npm installs** because it uses native core modules:

```bash
# Clone the repository
git clone https://github.com/adhithyam0210-ai/portfolio.git

# Navigate into the project folder
cd portfolio

# Start the server
npm start
# or: node server.js
```

Console output:
```text
====================================================
Portfolio REST API Server running at:
> Local:    http://localhost:5000
> Admin:    http://localhost:5000/admin.html
> REST API: http://localhost:5000/api/portfolio
====================================================
```

Open `http://localhost:5000` in your web browser.

---

### 2. Run with Python

If you prefer Python, an identical zero-dependency server is included:

```bash
# From the project root
python server.py
# On Windows, you can also use:
py server.py
```

Console output:
```text
====================================================
Python Portfolio Server running at:
> Local:    http://localhost:5000
> Admin:    http://localhost:5000/admin.html
> REST API: http://localhost:5000/api/portfolio
====================================================
```

---

### 3. Run Standalone (Static Mode)

You can also run the portfolio without any server:
1. Double-click `index.html` to view the website directly in your browser.
2. Double-click `admin.html` to manage your portfolio data via browser `localStorage`.

---

## Admin Portal & Management

Access the admin dashboard at:
```
http://localhost:5000/admin.html
```

- **Default Passcode:** `admin123`
- You can change your password at any time under the **Security** tab.
- All modifications made via the Admin Portal immediately update `data/portfolio.json` and reflect on the public website upon refresh.

### Backup & Restore
- **Export Backup:** Click **Export JSON** in the Security tab to download a timestamped snapshot of your portfolio data.
- **Import Backup:** Restore your data at any time by uploading a previously saved JSON backup.

---

## REST API Reference

The backend exposes a full suite of RESTful JSON endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/portfolio` | Retrieve complete portfolio dataset (profile, projects, skills, etc.) |
| `PUT` | `/api/portfolio` | Overwrite or batch-update the entire portfolio dataset |
| `GET` | `/api/projects` | Fetch all project records |
| `POST` | `/api/projects` | Create a new project card |
| `PUT` | `/api/projects/:id` | Update an existing project by ID |
| `DELETE` | `/api/projects/:id` | Delete a project by ID |
| `PUT` | `/api/profile` | Update user profile, bio, role, and social links |
| `PUT` | `/api/skills` | Update technical skills structure and tags |
| `PUT` | `/api/experience` | Update professional career timeline entries |
| `PUT` | `/api/education` | Update education and academic qualifications |
| `POST` | `/api/contact` | Receive and log contact inquiry messages |

---

## Directory Structure

```text
portfolio/
├── assets/
│   └── projects/           # Static project preview images
│       ├── genkraft_studio.jpg
│       ├── horizon_fintech.jpg
│       └── nexus_ai.jpg
├── css/
│   ├── admin.css           # Styling for Admin Portal dashboard
│   └── style.css           # Main portfolio consumer-tech design system & themes
├── data/
│   └── portfolio.json      # Primary JSON database file
├── js/
│   ├── admin.js            # Admin dashboard logic, CRUD modals, and lock screen
│   ├── api.js              # Unified REST API & LocalStorage communication layer
│   ├── canvas.js           # Dynamic canvas background utility
│   ├── config.js           # Static fallback configuration data
│   └── main.js             # Public portfolio rendering, search, and interactions
├── admin.html              # Password-protected administrative management portal
├── index.html              # Public developer portfolio homepage
├── package.json            # Node.js metadata and execution scripts
├── README.md               # Project documentation
├── server.js               # Zero-dependency Node.js HTTP & REST API server
└── server.py               # Alternative zero-dependency Python HTTP & REST API server
```

---

## Data Model

All portfolio information is stored in `data/portfolio.json` with the following root schema:

```json
{
  "profile": {
    "name": "ADHITHYA",
    "role": "SOFTWARE TESTER",
    "location": "Chennai/TamilNadu",
    "tagline": "SOFTWARE TESTER",
    "bio": "Motivated B.Tech graduate in AI and Data Science...",
    "email": "adhithyam0210@gmail.com",
    "github": "https://github.com/adhithyam0210-ai",
    "linkedin": "https://www.linkedin.com/in/adhithya03",
    "avatar": "data:image/jpeg;base64,..."
  },
  "categories": [
    { "id": "all", "label": "All Projects" },
    { "id": "testing", "label": "Software Testing" },
    { "id": "fullstack", "label": "Full Stack" },
    { "id": "frontend", "label": "Frontend" },
    { "id": "backend", "label": "Backend & APIs" },
    { "id": "tools", "label": "Developer Tools" }
  ],
  "projects": [
    {
      "id": "nexus-ai",
      "title": "Nexus Telemetry Dashboard",
      "category": "fullstack",
      "categoryLabel": "Full Stack",
      "image": "assets/projects/nexus_ai.jpg",
      "summary": "Real-time telemetry and analytics platform...",
      "tech": ["React", "TypeScript", "Node.js", "WebSockets"],
      "liveUrl": "https://example.com/demo",
      "githubUrl": "https://github.com/example/nexus-telemetry"
    }
  ],
  "skills": {
    "frontend": {
      "title": "Frontend Development",
      "items": ["React.js", "Next.js", "TypeScript", "JavaScript (ES6+)"]
    },
    "backend": {
      "title": "Backend & Architecture",
      "items": ["Node.js", "Express.js", "Python", "SQL", "PostgreSQL"]
    },
    "tools": {
      "title": "Tools & DevOps / Testing",
      "items": ["Git & GitHub", "Jira", "Manual & Regression Testing", "Postman"]
    }
  },
  "education": [],
  "experience": []
}
```

---

## Deployment Guide

### Option 1: Static Hosting (GitHub Pages / Vercel / Netlify)
Since the client includes automatic `localStorage` and `js/config.js` fallback:
1. Push this repository to GitHub.
2. Go to your repository **Settings** > **Pages**.
3. Under **Branch**, select `main` and root `/`, then save.
4. Your portfolio is live worldwide! (Any updates saved through `admin.html` will persist locally in the visitor's browser).

### Option 2: Full-Stack Cloud Hosting (Render / Railway / VPS)
To enable the persistent REST API on the web:
1. Deploy as a Node.js web service with build command `npm install` (or no-op) and start command `node server.js`.
2. Ensure the `PORT` environment variable is mapped (default fallback is `5000`).
3. If using persistent disks or Docker, mount `./data` to retain JSON changes across redeploys.

---

## Contact & Profile

**ADHITHYA** — Software Tester & Full-Stack Developer  
- **Email:** [adhithyam0210@gmail.com](mailto:adhithyam0210@gmail.com)  
- **GitHub:** [@adhithyam0210-ai](https://github.com/adhithyam0210-ai)  
- **LinkedIn:** [in/adhithya03](https://www.linkedin.com/in/adhithya03)  
- **Location:** Chennai / Bengaluru, India

---

## License

This project is licensed under the [ISC License](LICENSE). Feel free to use and adapt this portfolio template for your personal projects.
