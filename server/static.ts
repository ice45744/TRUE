import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

let __dirname: string;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = dirname(__filename);
} catch (e) {
  // Fallback for CJS/older environments if import.meta is not available
  __dirname = dirname(new URL(import.meta.url).pathname);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.get("*all", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.includes(".")) {
      return next();
    }
    console.log(`[static] Serving index.html for ${req.path}`);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
