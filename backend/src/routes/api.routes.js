import express from 'express';
import { crawl, removeSite, getSites } from '../controllers/crawler.controller.js';
import { chat } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/index', crawl);
router.delete('/index', removeSite);
router.get('/sites', getSites);
router.post('/chat', chat);

export default router;