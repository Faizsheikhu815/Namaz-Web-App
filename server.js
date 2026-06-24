const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4175);
const ROOT = __dirname;
const PUBLIC_FILES = new Set(["/", "/index.html", "/styles.css", "/script.js"]);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8"
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const url = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  if (!PUBLIC_FILES.has(url)) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  fs.readFile(path.join(ROOT, url), (error, content) => {
    if (error) {
      sendJson(res, 500, { error: "Unable to read file" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(url)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/health") {
    sendJson(res, 200, { ok: true, service: "Noor Companion" });
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Noor Companion running at http://127.0.0.1:${PORT}`);
});