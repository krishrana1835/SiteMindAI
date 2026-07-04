import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.routes.js";
import { siteStore } from './storage/siteStore.js';
import { vectorStoreService } from './storage/vectorStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RAG Chatbot Backend is running",
  });
});

const CLEANUP_INTERVAL = 60 * 60 * 1000;
const TTL = 24 * 60 * 60 * 1000;

function cleanupExpiredSites() {
  console.log('Running periodic cleanup of expired sites...');
  const sites = siteStore.findAllSites();
  const now = Date.now();

  for (const site of sites) {
    // Only check ready sites for expiration
    if (site.status === 'ready') {
      const age = now - new Date(site.indexedAt).getTime();
      if (age > TTL) {
        console.log(`Site expired: ${site.originalUrl}. Removing from cache.`);
        siteStore.removeSite(site.normalizedUrl);
        vectorStoreService.deleteChunks(site.id);
      }
    }
    // Optional: Clean up 'failed' or 'indexing' sites that are very old
    else if (site.status === 'failed' || site.status === 'indexing') {
        const age = now - new Date(site.indexedAt).getTime();
        if (age > TTL) { // Using the same TTL for stalled jobs
            console.log(`Stalled or failed job for ${site.originalUrl} is being removed.`);
            siteStore.removeSite(site.normalizedUrl);
            vectorStoreService.deleteChunks(site.id);
        }
    }
  }
}

setInterval(cleanupExpiredSites, CLEANUP_INTERVAL);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});