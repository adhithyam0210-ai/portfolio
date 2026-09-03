#!/usr/bin/env python3
"""
Python REST API Server for Portfolio & Admin Portal
Zero External Dependencies (Uses standard library http.server & json)
Run with: python server.py (or py server.py)
"""

import os
import json
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

PORT = 5000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'portfolio.json')

def ensure_data_file():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        initial = {
            "profile": {
                "name": "ADHITHYA",
                "role": "Software Tester",
                "location": "Chennai/TamilNadu",
                "tagline": "Software Tester",
                "bio": "Motivated B.Tech graduate specializing in SDLC, STLC, manual & automated testing.",
                "email": "adhithyam0210@gmail.com",
                "github": "https://github.com/adhithyam0210-ai",
                "linkedin": "https://www.linkedin.com/in/adhithya03"
            },
            "categories": [
                { "id": "all", "label": "All Projects" },
                { "id": "testing", "label": "Software Testing" },
                { "id": "fullstack", "label": "Full Stack" },
                { "id": "frontend", "label": "Frontend" },
                { "id": "backend", "label": "Backend & APIs" },
                { "id": "tools", "label": "Developer Tools" }
            ],
            "projects": [],
            "skills": {},
            "experience": []
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(initial, f, indent=2)

def read_data():
    ensure_data_file()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print("Error reading data:", e)
        return {}

def write_data(data):
    ensure_data_file()
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print("Error writing data:", e)
        return False

class PortfolioRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            raw = self.rfile.read(content_length).decode('utf-8')
            try:
                return json.loads(raw)
            except Exception:
                return {}
        return {}

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # REST API Routes
        if path == '/api/portfolio':
            return self._send_json(200, read_data())

        if path == '/api/projects':
            data = read_data()
            return self._send_json(200, data.get('projects', []))

        # Static File Serving
        if path == '/' or path == '':
            file_path = os.path.join(BASE_DIR, 'index.html')
        else:
            rel_path = path.lstrip('/')
            file_path = os.path.join(BASE_DIR, rel_path)

        # Prevent traversal
        if not os.path.abspath(file_path).startswith(BASE_DIR):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Access Denied")
            return

        if os.path.isfile(file_path):
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'application/octet-stream'
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', mime_type)
            self.end_headers()
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(b"404 Not Found")

    def do_POST(self):
        path = urlparse(self.path).path

        if path == '/api/projects':
            body = self._read_json_body()
            data = read_data()
            data['projects'] = data.get('projects', [])
            import time
            new_project = {
                "id": body.get("id") or f"proj-{int(time.time() * 1000)}",
                "title": body.get("title", "Untitled Project"),
                "category": body.get("category", "fullstack"),
                "categoryLabel": body.get("categoryLabel", "Full Stack"),
                "image": body.get("image", "assets/projects/nexus_ai.jpg"),
                "summary": body.get("summary", ""),
                "tech": body.get("tech", []),
                "liveUrl": body.get("liveUrl", ""),
                "githubUrl": body.get("githubUrl", "")
            }
            data['projects'].insert(0, new_project)
            write_data(data)
            return self._send_json(201, {"success": True, "project": new_project})

        if path == '/api/contact':
            body = self._read_json_body()
            print("[Contact Inquiry Received]:", body)
            return self._send_json(200, {"success": True, "message": "Inquiry received"})

        self._send_json(404, {"error": "API route not found"})

    def do_PUT(self):
        path = urlparse(self.path).path

        if path == '/api/portfolio':
            body = self._read_json_body()
            if write_data(body):
                return self._send_json(200, {"success": True, "data": body})
            return self._send_json(500, {"error": "Failed to write data"})

        if path.startswith('/api/projects/'):
            project_id = path.replace('/api/projects/', '')
            body = self._read_json_body()
            data = read_data()
            projects = data.get('projects', [])
            idx = next((i for i, p in enumerate(projects) if p.get('id') == project_id), -1)
            if idx == -1:
                return self._send_json(404, {"error": "Project not found"})
            projects[idx].update(body)
            projects[idx]['id'] = project_id
            write_data(data)
            return self._send_json(200, {"success": True, "project": projects[idx]})

        if path == '/api/profile':
            body = self._read_json_body()
            data = read_data()
            data['profile'] = {**data.get('profile', {}), **body}
            write_data(data)
            return self._send_json(200, {"success": True, "profile": data['profile']})

        if path == '/api/skills':
            body = self._read_json_body()
            data = read_data()
            data['skills'] = body
            write_data(data)
            return self._send_json(200, {"success": True, "skills": data['skills']})

        if path == '/api/experience':
            body = self._read_json_body()
            data = read_data()
            data['experience'] = body if isinstance(body, list) else body.get('experience', [])
            write_data(data)
            return self._send_json(200, {"success": True, "experience": data['experience']})

        if path == '/api/education':
            body = self._read_json_body()
            data = read_data()
            data['education'] = body if isinstance(body, list) else body.get('education', [])
            write_data(data)
            return self._send_json(200, {"success": True, "education": data['education']})

        self._send_json(404, {"error": "API route not found"})

    def do_DELETE(self):
        path = urlparse(self.path).path

        if path.startswith('/api/projects/'):
            project_id = path.replace('/api/projects/', '')
            data = read_data()
            projects = data.get('projects', [])
            initial_len = len(projects)
            data['projects'] = [p for p in projects if p.get('id') != project_id]
            if len(data['projects']) == initial_len:
                return self._send_json(404, {"error": "Project not found"})
            write_data(data)
            return self._send_json(200, {"success": True, "message": "Project deleted"})

        self._send_json(404, {"error": "API route not found"})

def run():
    ensure_data_file()
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, PortfolioRequestHandler)
    print(f"====================================================")
    print(f"Portfolio REST API Server running at:")
    print(f"> Local:    http://localhost:{PORT}")
    print(f"> Admin:    http://localhost:{PORT}/admin.html")
    print(f"> REST API: http://localhost:{PORT}/api/portfolio")
    print(f"====================================================")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
