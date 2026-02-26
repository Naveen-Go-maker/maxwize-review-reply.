import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".jsx":  "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
};

createServer(async (req, res) => {
  const url = req.url.split("?")[0];
  const filePath = join(__dirname, url === "/" ? "index.html" : url);
  try {
    let content = await readFile(filePath);
    const ext = extname(filePath);

    // Transform ReviewReply.jsx so it runs without a bundler
    if (ext === ".jsx") {
      let src = content.toString("utf8");
      // Remove ES module import (React will be a global from CDN)
      src = src.replace(/^import\s+\{[^}]+\}\s+from\s+['"]react['"];?\r?\n?/m, "");
      // Inject React hook destructuring
      src =
        "const { useState, useEffect, useRef } = React;\n" + src;
      // Remove export default so the function is just a regular declaration
      src = src.replace("export default function ReviewReply", "function ReviewReply");
      // Mount the component
      src +=
        "\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ReviewReply));";
      content = Buffer.from(src, "utf8");
    }

    res.writeHead(200, {
      "Content-Type": mime[ext] || "text/plain",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end("Not found: " + url);
  }
}).listen(PORT, () => {
  console.log(`\n  ReviewReply → http://localhost:${PORT}\n`);
});
