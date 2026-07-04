import express from 'express';
import { crawl } from '../controllers/crawler.controller.js';
import { chat } from '../controllers/chat.controller.js';
import { rateLimit } from "express-rate-limit";

const router = express.Router();

const crawlLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You can only crawl one website every 10 seconds.",
  },
});

router.post('/crawl', crawlLimiter, crawl);
router.post('/chat', crawlLimiter, chat);

export default router;