import express from 'express';
import { crawl } from '../controllers/crawler.controller.js';
import { chat } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/crawl', crawl);
router.post('/chat', chat);

export default router;