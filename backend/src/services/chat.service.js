import { streamText } from 'ai'; 
import { groq } from '@ai-sdk/groq';
import { generateEmbedding } from './embedding.service.js';
import { getAllChunks } from './vectorStore.service.js';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';

export async function streamRagResponse(userQuery, res) {
    const queryVector = await generateEmbedding(userQuery);
    const store = getAllChunks();

    if (store.length === 0) {
        throw new Error("No website has been indexed yet. Please crawl a site first.");
    }

    const scoredChunks = store.map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryVector, chunk.embedding)
    }));

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 2);
    
    const sources = [...new Set(topChunks.map(c => c.url))];

    const contextText = topChunks.map(c => `[Source: ${c.url}]\n${c.text}`).join("\n\n");
    
    const prompt = `
    You are a helpful assistant. Answer the user's question strictly using the provided context below.
    If the context does not contain the answer, say "I cannot find the answer on this website."
    Always cite your sources using the exact URL provided in the context.
    
    Context:
    ${contextText}
    
    User Question: ${userQuery}
    `;

    const { textStream } = await streamText({
        model: groq('llama-3.1-8b-instant'), 
        prompt: prompt
    });

    for await (const textPart of textStream) {
        res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ sources: sources })}\n\n`);
    res.end();
}