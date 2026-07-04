import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export async function generateEmbedding(text) {
    const { embedding } = await embed({
        model: google.textEmbedding('gemini-embedding-001'), 
        value: text 
    });
    return embedding;
}