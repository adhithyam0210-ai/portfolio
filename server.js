/**
 * REST API Server for Portfolio & Admin Portal
 * Built with Node.js native HTTP module (Zero external dependencies required!)
 * Run with: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'portfolio.json');

// Ensure data folder and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      profile: {
        name: "ADHITHYA",
        role: "Software Tester",
        location: "Chennai/TamilNadu",
        tagline: "Software Tester",
        bio: "Motivated B.Tech graduate specializing in SDLC, STLC, manual & automated testing.",
        email: "adhithyam0210@gmail.com",
        github: "https://github.com/adhithyam0210-ai",
        linkedin: "https://www.linkedin.com/in/adhithya03"
      },
      categories: [
        { id: "all", label: "All Projects" },
        { id: "fullstack", label: "Full Stack" },
        { id: "frontend", label: "Frontend" },
        { id: "backend", label: "Backend & APIs" },
        { id: "tools", label: "Developer Tools" }
      ],
      projects: [],
      skills: {},
      experience: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading portfolio.json:', err);
    return null;
  }
}

function writeData(data) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing portfolio.json:', err);
    return false;
  }
}

// MIME Types for Static Files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Request Body Parser
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 25 * 1024 * 1024) { // 25MB max for base64 images
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

// Server Dispatcher
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ==========================================
  // REST API Endpoints
  // ==========================================
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
      // GET /api/portfolio
      if (pathname === '/api/portfolio' && method === 'GET') {
        const data = readData();
        res.writeHead(200);
        return res.end(JSON.stringify(data));
      }

      // PUT /api/portfolio (replace full portfolio data)
      if (pathname === '/api/portfolio' && method === 'PUT') {
        const body = await parseBody(req);
        if (writeData(body)) {
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, message: 'Portfolio data updated', data: body }));
        } else {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: 'Failed to write data' }));
        }
      }

      // GET /api/projects
      if (pathname === '/api/projects' && method === 'GET') {
        const data = readData();
        res.writeHead(200);
        return res.end(JSON.stringify(data.projects || []));
      }

      // POST /api/projects (Create project)
      if (pathname === '/api/projects' && method === 'POST') {
        const body = await parseBody(req);
        const data = readData();
        data.projects = data.projects || [];

        const newProject = {
          id: body.id || 'proj-' + Date.now(),
          title: body.title || 'Untitled Project',
          category: body.category || 'fullstack',
          categoryLabel: body.categoryLabel || 'Full Stack',
          image: body.image || 'assets/projects/nexus_ai.jpg',
          summary: body.summary || '',
          tech: Array.isArray(body.tech) ? body.tech : [],
          liveUrl: body.liveUrl || '',
          githubUrl: body.githubUrl || ''
        };

        data.projects.unshift(newProject);
        writeData(data);

        res.writeHead(201);
        return res.end(JSON.stringify({ success: true, project: newProject }));
      }

      // PUT /api/projects/:id (Update project)
      if (pathname.startsWith('/api/projects/') && method === 'PUT') {
        const id = pathname.replace('/api/projects/', '');
        const body = await parseBody(req);
        const data = readData();
        data.projects = data.projects || [];

        const idx = data.projects.findIndex(p => p.id === id);
        if (idx === -1) {
          res.writeHead(404);
          return res.end(JSON.stringify({ error: 'Project not found' }));
        }

        data.projects[idx] = {
          ...data.projects[idx],
          ...body,
          id // prevent changing ID
        };

        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, project: data.projects[idx] }));
      }

      // DELETE /api/projects/:id (Delete project)
      if (pathname.startsWith('/api/projects/') && method === 'DELETE') {
        const id = pathname.replace('/api/projects/', '');
        const data = readData();
        data.projects = data.projects || [];

        const initialLen = data.projects.length;
        data.projects = data.projects.filter(p => p.id !== id);

        if (data.projects.length === initialLen) {
          res.writeHead(404);
          return res.end(JSON.stringify({ error: 'Project not found' }));
        }

        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, message: 'Project deleted' }));
      }

      // PUT /api/profile
      if (pathname === '/api/profile' && method === 'PUT') {
        const body = await parseBody(req);
        const data = readData();
        data.profile = { ...(data.profile || {}), ...body };
        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, profile: data.profile }));
      }

      // PUT /api/skills
      if (pathname === '/api/skills' && method === 'PUT') {
        const body = await parseBody(req);
        const data = readData();
        data.skills = body;
        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, skills: data.skills }));
      }

      // PUT /api/experience
      if (pathname === '/api/experience' && method === 'PUT') {
        const body = await parseBody(req);
        const data = readData();
        data.experience = Array.isArray(body) ? body : (body.experience || []);
        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, experience: data.experience }));
      }

      // PUT /api/education
      if (pathname === '/api/education' && method === 'PUT') {
        const body = await parseBody(req);
        const data = readData();
        data.education = Array.isArray(body) ? body : (body.education || []);
        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, education: data.education }));
      }

      // POST /api/contact
      if (pathname === '/api/contact' && method === 'POST') {
        const body = await parseBody(req);
        console.log('[Contact Message Received]:', body);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, message: 'Inquiry received' }));
      }

      // 404 API Not Found
      res.writeHead(404);
      return res.end(JSON.stringify({ error: 'API route not found' }));

    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500);
      return res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
    }
  }

  // ==========================================
  // Static File Serving
  // ==========================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

ensureDataFile();

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Portfolio REST API Server running at:`);
  console.log(`> Local:   http://localhost:${PORT}`);
  console.log(`> Admin:   http://localhost:${PORT}/admin.html`);
  console.log(`> REST API: http://localhost:${PORT}/api/portfolio`);
  console.log(`====================================================`);
});
