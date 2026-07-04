import { streamText } from 'ai'; 
import { groq } from '@ai-sdk/groq';
import { generateEmbedding } from './embedding.service.js';
import { vectorStoreService } from '../storage/vectorStore.js';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';
import { siteStore } from '../storage/siteStore.js';

export async function streamRagResponse(userQuery, siteId, res) {
    console.log(`Received query: "${userQuery}" for site: ${siteId}`);

    // --- SSE headers: must be set before any writes ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
        const queryVector = await generateEmbedding(userQuery);

        // Step 7: Search Only the Current Website
        const siteChunks = vectorStoreService.getChunks(siteId);
        console.log(`Found ${siteChunks.length} chunks for site: ${siteId}`);

        if (!siteChunks || siteChunks.length === 0) {
            const site = siteStore.getSite(siteId);
            const siteUrl = site ? site.originalUrl : 'the specified site';
            const message = `No content has been indexed for ${siteUrl}. Please crawl the site first.`;
            console.error(message);
            res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
            return res.end();
        }

        const scoredChunks = siteChunks.map(chunk => ({
            ...chunk,
            score: cosineSimilarity(queryVector, chunk.embedding)
        }));

        scoredChunks.sort((a, b) => b.score - a.score);
        const topChunks = scoredChunks.slice(0, 3);

        const sources = [...new Set(topChunks.map(c => c.metadata.originalUrl))];

        const contextText = topChunks
            .map(c => `[Source: ${c.metadata.originalUrl}]${c.text}`)
            .join("\n\n");

        const prompt = `
    You are a helpful assistant for the website: ${sources[0] || ''}. 
    Answer the user's question strictly using the provided context below.
    If the context does not contain the answer, say "I cannot find the answer on this website."
    Do not mention the user's question in your answer.
    Never search across chunks belonging to unrelated websites.
    
    Context:
    ${contextText}
    
    User Question: ${userQuery}
    `;

        const { textStream } = await streamText({
            model: groq('llama-3.1-8b-instant'),
            prompt: prompt
        });

        // Stream the text response
        let hasSentData = false;
        for await (const textPart of textStream) {
            console.log("Text part streamed:", textPart);
            res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
            hasSentData = true;
        }

        if (!hasSentData) {
            console.log("No data was streamed from the AI model.");
        }

        // After the text stream is complete, send the sources
        res.write(`data: ${JSON.stringify({ sources })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();

    } catch (err) {
        console.error("streamRagResponse failed:", err);
        try {
            res.write(`data: ${JSON.stringify({ error: err.message || 'Internal error' })}\n\n`);
        } catch (writeErr) {
            console.error("Failed to write error to stream:", writeErr);
        }
        res.end();
    }
}