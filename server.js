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
        { id: "testing", label: "Software Testing" },
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
    const configPath = path.join(__dirname, 'js', 'config.js');
    const configContent = `/**\n * Portfolio Configuration Data (Zero Emojis)\n * Fallback static data matching data/portfolio.json\n */\n\nconst PORTFOLIO_DATA = ${JSON.stringify(data, null, 2)};\n`;
    fs.writeFileSync(configPath, configContent, 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing portfolio.json:', err);
    return false;
  }
}

const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

function readMessages() {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) return [];
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeMessages(msgs) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing messages.json:', err);
    return false;
  }
}

const DB_CONFIG_FILE = path.join(__dirname, 'js', 'db-config.js');

function readDbConfig() {
  try {
    if (!fs.existsSync(DB_CONFIG_FILE)) return { url: '', anonKey: '' };
    const content = fs.readFileSync(DB_CONFIG_FILE, 'utf8');
    const urlMatch = content.match(/url\s*:\s*['"]([^'"]*)['"]/);
    const keyMatch = content.match(/anonKey\s*:\s*['"]([^'"]*)['"]/);
    return {
      url: urlMatch ? urlMatch[1] : '',
      anonKey: keyMatch ? keyMatch[1] : ''
    };
  } catch (err) {
    console.error('Error reading db-config.js:', err);
    return { url: '', anonKey: '' };
  }
}

function writeDbConfig(config) {
  try {
    const url = (config && config.url) ? String(config.url).trim() : '';
    const anonKey = (config && (config.anonKey || config.key)) ? String(config.anonKey || config.key).trim() : '';

    const content = `/**
 * Supabase Cloud Database Configuration
 * Client-Safe Configuration (Uses public anon key)
 * 
 * Auto-persisted by Admin Portal & Server.
 * Connect once, permanently active for all visitors and sessions.
 */

window.SUPABASE_CONFIG = {
  // Public project URL (e.g., 'https://xyzproject.supabase.co')
  url: '${url}',
  
  // Public anonymous key (starts with eyJhbGciOi...)
  anonKey: '${anonKey}'
};

// Auto-sync into browser localStorage if not already present
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const cachedUrl = localStorage.getItem('sb_portfolio_url');
    const cachedKey = localStorage.getItem('sb_portfolio_key');
    if (window.SUPABASE_CONFIG.url) {
      localStorage.setItem('sb_portfolio_url', window.SUPABASE_CONFIG.url);
    } else if (cachedUrl) {
      window.SUPABASE_CONFIG.url = cachedUrl;
    }
    if (window.SUPABASE_CONFIG.anonKey) {
      localStorage.setItem('sb_portfolio_key', window.SUPABASE_CONFIG.anonKey);
    } else if (cachedKey) {
      window.SUPABASE_CONFIG.anonKey = cachedKey;
    }
  } catch (e) {
    // localStorage may be disabled or restricted
  }
}
`;
    fs.writeFileSync(DB_CONFIG_FILE, content, 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing db-config.js:', err);
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
      // GET /api/config/db (Get permanent database config)
      if (pathname === '/api/config/db' && method === 'GET') {
        const dbConf = readDbConfig();
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, ...dbConf }));
      }

      // POST or PUT /api/config/db (Save permanent database config)
      if (pathname === '/api/config/db' && (method === 'POST' || method === 'PUT')) {
        const body = await parseBody(req);
        if (writeDbConfig(body)) {
          console.log('[Database Config]: Permanently saved Supabase keys to js/db-config.js');
          res.writeHead(200);
          return res.end(JSON.stringify({
            success: true,
            message: 'Database configuration permanently saved to js/db-config.js',
            config: readDbConfig()
          }));
        } else {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: 'Failed to write js/db-config.js' }));
        }
      }

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

      // PUT /api/courses
      if (pathname === '/api/courses' && method === 'PUT') {
        const body = await parseBody(req);
        const data = readData();
        data.courses = Array.isArray(body) ? body : (body.courses || []);
        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, courses: data.courses }));
      }

      // PUT /api/coursesHeader
      if (pathname === '/api/coursesHeader' && method === 'PUT') {
        const body = await parseBody(req);
        const data = readData();
        data.coursesHeader = { ...(data.coursesHeader || {}), ...body };
        writeData(data);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, coursesHeader: data.coursesHeader }));
      }

      // GET /api/messages
      if (pathname === '/api/messages' && method === 'GET') {
        const msgs = readMessages();
        res.writeHead(200);
        return res.end(JSON.stringify(msgs));
      }

      // POST /api/messages or /api/contact
      if ((pathname === '/api/messages' || pathname === '/api/contact') && method === 'POST') {
        const body = await parseBody(req);
        const msgs = readMessages();
        const newMsg = {
          id: body.id || 'msg-' + Date.now(),
          name: body.name || 'Anonymous',
          email: body.email || '',
          message: body.message || '',
          created_at: body.created_at || body.timestamp || new Date().toISOString(),
          is_read: false
        };
        msgs.unshift(newMsg);
        writeMessages(msgs);
        console.log('[Inquiry Received & Saved]:', newMsg.name, newMsg.email);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, message: 'Inquiry received and saved', data: newMsg }));
      }

      // DELETE /api/messages/:id
      if (pathname.startsWith('/api/messages/') && method === 'DELETE') {
        const id = pathname.replace('/api/messages/', '');
        const msgs = readMessages();
        const filtered = msgs.filter(m => m.id !== id);
        writeMessages(filtered);
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, message: 'Message deleted' }));
      }

      // PATCH or PUT /api/messages/:id (mark as read / unread)
      if (pathname.startsWith('/api/messages/') && (method === 'PATCH' || method === 'PUT')) {
        const id = pathname.replace('/api/messages/', '');
        const body = await parseBody(req);
        const msgs = readMessages();
        const msg = msgs.find(m => m.id === id);
        if (msg) {
          if (typeof body.is_read !== 'undefined') msg.is_read = Boolean(body.is_read);
          else msg.is_read = true;
          writeMessages(msgs);
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, message: 'Message updated', data: msg }));
        }
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'Message not found' }));
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

    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf'
    };

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const totalSize = stats.size;

    // Handle HTTP Range Requests for instant Video Seeking & Scrubbing
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm' || ext === '.ogg')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`
        });
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      fileStream.pipe(res);
    } else {
      const isCodeAsset = ext === '.html' || ext === '.css' || ext === '.js' || ext === '.json';
      const headers = {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      };
      if (isCodeAsset) {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
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
