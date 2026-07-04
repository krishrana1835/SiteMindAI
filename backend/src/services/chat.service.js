import { streamText } from 'ai'; 
import { groq } from '@ai-sdk/groq';
import { generateEmbedding } from './embedding.service.js';
import { vectorStoreService } from '../storage/vectorStore.js';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';
import { siteStore } from '../storage/siteStore.js';

export async function streamRagResponse(userQuery, siteId, res) {
    const queryVector = await generateEmbedding(userQuery);
    
    // Step 7: Search Only the Current Website
    const siteChunks = vectorStoreService.getChunks(siteId);

    if (!siteChunks || siteChunks.length === 0) {
        const site = siteStore.getSite(siteId); // It might be better to look up by normalizedUrl
        const siteUrl = site ? site.originalUrl : 'the specified site';
        throw new Error(`No content has been indexed for ${siteUrl}. Please crawl the site first.`);
    }

    const scoredChunks = siteChunks.map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryVector, chunk.embedding)
    }));

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 5); // Use more chunks for better context
    
    const sources = [...new Set(topChunks.map(c => c.metadata.originalUrl))];

    const contextText = topChunks.map(c => `[Source: ${c.metadata.originalUrl}]${c.text}`).join("\n\n");
    
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
    for await (const textPart of textStream) {
        res.write(`data: ${JSON.stringify({ text: textPart })}`);
    }

    // After the text stream is complete, send the sources
    res.write(`data: ${JSON.stringify({ sources: sources })}`);
    res.end();
}
