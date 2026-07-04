import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { generateEmbedding } from './embedding.service.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import { siteStore } from '../storage/siteStore.js';
import { vectorStoreService } from '../storage/vectorStore.js';

const TTL = 24 * 60 * 60 * 1000; // 24 hours

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

async function crawlAndChunk(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const html = await page.content();
    const title = await page.title();
    await browser.close();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) throw new Error("Could not extract main content from this page.");

    const cleanText = article.textContent.replace(/\s+/g, ' ').trim();
    const rawChunks = createPredictableChunks(cleanText, 1000);

    return { rawChunks, title };
}

export async function indexWebsite(originalUrl, force = false) {
    const normalizedUrl = normalizeUrl(originalUrl);
    if (!normalizedUrl) {
        throw new Error('Invalid URL provided.');
    }

    const existingSite = siteStore.getSite(normalizedUrl);

    // Step 9: Support Force Reindex
    if (force && existingSite) {
        await vectorStoreService.deleteChunks(existingSite.id);
        siteStore.removeSite(normalizedUrl);
    } else {
        // Step 4 & 8: Check Cache and Expiration
        if (existingSite) {
            if (existingSite.status === 'ready') {
                const age = Date.now() - new Date(existingSite.indexedAt).getTime();
                if (age < TTL) {
                    return { message: 'Site is already indexed and cache is fresh.', site: existingSite, fromCache: true };
                }
            }
            // Step 6: Prevent Duplicate Crawls
            else if (existingSite.status === 'indexing') {
                return { message: 'Indexing is already in progress for this site.', site: existingSite, inProgress: true };
            }
        }
    }

    // Step 5 & 6: Save Site Metadata and set status to "indexing"
    let site = siteStore.getSite(normalizedUrl);
    if (!site) {
        site = siteStore.addSite(originalUrl, normalizedUrl);
    } else {
        siteStore.updateSite(normalizedUrl, { status: 'indexing' });
    }

    try {
        const { rawChunks, title } = await crawlAndChunk(originalUrl);

        const processedChunks = [];
        for (const text of rawChunks) {
            const embedding = await generateEmbedding(text);
            processedChunks.push({ siteId: site.id, text, embedding, metadata: { originalUrl } });
        }

        // Step 3: Group Vector Data by Website
        vectorStoreService.saveChunks(site.id, processedChunks);
        
        // Step 5: Update site metadata after successful indexing
        const updatedSite = siteStore.updateSite(normalizedUrl, {
            status: 'ready',
            indexedAt: new Date(),
            chunkCount: processedChunks.length,
            title: title || site.title,
        });

        return { message: 'Website indexed successfully.', site: updatedSite, fromCache: false };

    } catch (error) {
        // Handle failed indexing
        siteStore.updateSite(normalizedUrl, { status: 'failed' });
        console.error('Indexing failed for:', originalUrl, error);
        throw error;
    }
}
