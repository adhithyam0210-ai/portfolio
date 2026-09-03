/**
 * Portfolio Configuration Data (Zero Emojis)
 * Fallback static data matching data/portfolio.json
 */

const PORTFOLIO_DATA = {
  profile: {
    name: "ADHITHYA",
    role: "Software Tester",
    location: "Chennai/TamilNadu",
    tagline: "Building scalable web applications, robust APIs, and clean interfaces.",
    bio: "Motivated B.Tech graduate in Artificial Intelligence and Data Science with a solid understanding of Software Development Life Cycle (SDLC), Software Testing Life Cycle (STLC), Manual Testing, Functional Testing, Regression Testing, and Defect Life Cycle. Proficient in SQL, Jira, and Agile methodologies. Seeking an entry-level Software Test Engineer position to apply testing knowledge, analytical skills, and a commitment to delivering reliable software solutions.",
    email: "adhithyam0210@gmail.com",
    github: "https://github.com/adhithyam0210-ai",
    linkedin: "https://www.linkedin.com/in/adhithya03",
    avatar: ""
  },
  categories: [
    { id: "all", label: "All Projects" },
    { id: "testing", label: "Software Tester" },
    { id: "fullstack", label: "Full Stack" },
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend & APIs" },
    { id: "tools", label: "Developer Tools" }
  ],
  projects: [
    {
      id: "nexus-ai",
      title: "Nexus Telemetry Dashboard",
      category: "fullstack",
      categoryLabel: "Full Stack",
      image: "assets/projects/nexus_ai.jpg",
      summary: "A real-time telemetry and analytics platform that monitors distributed services, tracks API latencies, and visualizes system throughput.",
      tech: ["React", "TypeScript", "Node.js", "WebSockets", "TailwindCSS"],
      liveUrl: "https://example.com/demo",
      githubUrl: "https://github.com/example/nexus-telemetry"
    },
    {
      id: "horizon-fintech",
      title: "Horizon Digital Payments",
      category: "frontend",
      categoryLabel: "Frontend",
      image: "assets/projects/horizon_fintech.jpg",
      summary: "A modern fintech web application featuring multi-currency transactions, interactive cash-flow analytics, and biometric authentication flows.",
      tech: ["Next.js", "TypeScript", "Chart.js", "CSS Modules", "REST API"],
      liveUrl: "https://example.com/demo",
      githubUrl: "https://github.com/example/horizon-payments"
    },
    {
      id: "genkraft-studio",
      title: "Genkraft Visual Workflow Editor",
      category: "tools",
      categoryLabel: "Developer Tools",
      image: "assets/projects/genkraft_studio.jpg",
      summary: "An interactive node-based canvas editor allowing teams to visually assemble, configure, and automate data transformation pipelines.",
      tech: ["HTML5 Canvas", "JavaScript", "SVG Engine", "Node.js"],
      liveUrl: "https://example.com/demo",
      githubUrl: "https://github.com/example/genkraft-studio"
    },
    {
      id: "task-orchestrator",
      title: "Distributed Task Queue & Worker",
      category: "backend",
      categoryLabel: "Backend & APIs",
      image: "assets/projects/nexus_ai.jpg",
      summary: "A resilient background job processing engine with priority queues, automatic retry mechanisms, and concurrency control.",
      tech: ["Node.js", "Redis", "PostgreSQL", "Docker", "Express"],
      liveUrl: "https://example.com/demo",
      githubUrl: "https://github.com/example/task-queue"
    }
  ],
  skills: {
    frontend: {
      title: "Frontend Development",
      items: ["React.js", "Next.js", "TypeScript", "JavaScript (ES6+)", "HTML5 & Semantic Web", "Modern CSS & Flexbox/Grid", "Tailwind CSS", "State Management"]
    },
    backend: {
      title: "Backend & Architecture",
      items: ["Node.js", "Express.js", "Python", "FastAPI", "RESTful APIs", "SQL & Relational DBs", "PostgreSQL", "MongoDB", "Redis Caching"]
    },
    tools: {
      title: "Tools & DevOps / Testing",
      items: ["Git & GitHub", "Jira & Agile Workflows", "Manual & Regression Testing", "Postman", "Docker", "CI/CD Pipelines", "Linux & Shell"]
    }
  },
  education: [
    {
      degree: "B.Tech in Artificial Intelligence & Data Science",
      institution: "Anna University Affiliated College",
      location: "Chennai, Tamil Nadu",
      period: "2020 — 2024",
      description: "Comprehensive study in SDLC, STLC, Database Management, Algorithms, Data Structures, and Software Engineering.",
      bullets: [
        "In-depth focus on Manual Testing, Test Case Design, Functional & Regression Testing, and Defect Life Cycle.",
        "Demonstrated proficiency in SQL database querying, Jira defect reporting, and Agile sprint methodologies."
      ]
    }
  ],
  experience: [
    {
      period: "2024 — Present",
      role: "Software Test Engineer",
      company: "Apex Technologies",
      location: "Bengaluru, India",
      description: "Developing comprehensive test scenarios, conducting functional and regression test cycles, collaborating with cross-functional engineering teams.",
      bullets: [
        "Authored and executed manual test suites across core application features with zero defect leakage.",
        "Tracked and managed defects using Jira with clear steps-to-reproduce and logs."
      ]
    }
  ]
};
