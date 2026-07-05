import { streamRagResponse } from '../services/chat.service.js';
import ApiError from '../utils/api.error.js';

export async function chat(req, res) {
    try {
        const { message, siteIds } = req.body;
        const sessionId = req.headers['x-session-id'];

        console.log(`Received chat request: sessionId=${sessionId}, message=${message}, siteIds=${siteIds}`);

        if (!sessionId) {
            const error = new ApiError(400, "Session ID is required");
            return res.status(error.statusCode).json(error);
        }
        
        if (!message) {
            const error = new ApiError(400, "Message is required");
            return res.status(error.statusCode).json(error);
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        await streamRagResponse(sessionId, message, siteIds || null, res);

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

        // Ensure headers are set before sending error for event-stream
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }
        
        res.write(`data: ${JSON.stringify({ error: errorPayload })}`);
        res.end();
    }
}
