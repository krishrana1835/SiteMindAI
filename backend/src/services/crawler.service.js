import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { generateEmbedding } from './embedding.service.js';

function createPredictableChunks(text, maxChars = 1000) {
    const chunks = [];
    let currentChunk = "";
    
    const sentences = text.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChars && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += sentence + " ";
    }
    
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

export async function processWebsite(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const html = await page.content();
    await browser.close();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) throw new Error("Could not extract main content from this page.");

    const cleanText = article.textContent.replace(/\s+/g, ' ').trim();
    
    const rawChunks = createPredictableChunks(cleanText, 1000);

    const processedChunks = [];
    for (const text of rawChunks) {
        const embedding = await generateEmbedding(text);
        processedChunks.push({ text, url, embedding });
    }

    return processedChunks;
}