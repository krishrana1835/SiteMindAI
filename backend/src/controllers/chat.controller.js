import { streamRagResponse } from '../services/chat.service.js';

export async function chat(req, res) {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        await streamRagResponse(message, res);

    } catch (error) {
        console.error("Chat Error:", error);

        const isApiError = error.name === 'APICallError' || error.name === 'AI_APICallError';
        
        const statusCode = error.statusCode || 500;
        const errorMessage = isApiError 
            ? `AI Provider Error: ${error.message}` 
            : error.message || "An unexpected error occurred.";

        const errorPayload = {
            success: false,
            type: isApiError ? 'API_ERROR' : 'GENERAL_ERROR',
            statusCode: statusCode,
            message: errorMessage
        };

        res.write(`data: ${JSON.stringify({ error: errorPayload })}\n\n`);
        res.end();
    }
}