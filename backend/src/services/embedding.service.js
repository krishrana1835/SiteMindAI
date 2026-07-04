import { embed } from 'ai';
import { google } from '@ai-sdk/google';
import embeddingLimiter from '../utils/limiter.js';

async function _generateEmbedding(text) {
    const { embedding } = await embed({
        model: google.textEmbedding('gemini-embedding-001'), 
        value: text 
    });
    return embedding;
}

export const generateEmbedding = embeddingLimiter.wrap(_generateEmbedding);