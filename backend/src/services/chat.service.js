import { streamText } from 'ai'; 
import { groq } from '@ai-sdk/groq';
import { generateEmbedding } from './embedding.service.js';
import { vectorStoreService } from '../storage/vectorStore.js';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';
import { siteStore } from '../storage/siteStore.js';

export async function streamRagResponse(userQuery, siteIds, res) {
    console.log(`Received query: "${userQuery}" for sites: ${siteIds}`);

    // --- SSE headers: must be set before any writes ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
        const queryVector = await generateEmbedding(userQuery);

        // Step 7: Search Only the Current Website
        const siteChunks = vectorStoreService.getChunks(siteIds);
        console.log(`Found ${siteChunks.length} chunks for sites: ${siteIds}`);

        if (!siteChunks || siteChunks.length === 0) {
            const message = `No content has been indexed for the specified sites. Please crawl the sites first.`;
            console.error(message);
            res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
            return res.end();
        }

        const scoredChunks = siteChunks.map(chunk => ({
            ...chunk,
            score: cosineSimilarity(queryVector, chunk.embedding)
        }));

        scoredChunks.sort((a, b) => b.score - a.score);
        const topChunks = scoredChunks.slice(0, 5);

        const sources = [...new Set(topChunks.map(c => c.metadata.originalUrl))];

        const contextText = topChunks
            .map(c => `[Source: ${c.metadata.originalUrl}] ${c.text}`)
            .join("\n\n---\n\n");

        const sitesString = sources.join(', ');
        const prompt = `
    You are a helpful assistant for the websites: ${sitesString}. 
    Answer the user's question strictly using the provided context below.
    If the context does not contain the answer, say "I cannot find the answer on the provided websites."
    Do not mention the user's question in your answer.
    Your answer should be based solely on the information from the following sources.
    
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
        let fullText = "";
        for await (const textPart of textStream) {
            fullText += textPart;
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