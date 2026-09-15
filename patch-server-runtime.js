const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let source = fs.readFileSync(serverPath, 'utf8');

const staticOld = "app.use(express.static(path.join(__dirname, 'frontend/dist')));";
const staticNew = "app.use(express.static(path.join(__dirname, 'frontend/dist'), { index: false, maxAge: '1y', immutable: true }));";

if (source.includes(staticOld)) {
  source = source.replace(staticOld, staticNew);
}

const catchAllOld = `app.get("*", (req, res) => {\n  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));\n});`;
const catchAllNew = `// SPA fallback: never turn missing API/static assets into HTML responses.\napp.get("*", (req, res) => {\n  if (req.path.startsWith("/api/")) {\n    return res.status(404).json({ error: "API endpoint not found" });\n  }\n\n  if (path.extname(req.path)) {\n    return res.status(404).send("Not found");\n  }\n\n  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");\n  res.set("Pragma", "no-cache");\n  res.set("Expires", "0");\n  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));\n});`;

if (source.includes(catchAllOld)) {
  source = source.replace(catchAllOld, catchAllNew);
}

fs.writeFileSync(serverPath, source);
console.log('Runtime server patch applied.');
