import { processWebsite } from '../services/crawler.service.js';
import { storeChunks, clearDatabase } from '../services/vectorStore.service.js';
import ApiError from '../utils/api.error.js';
import ApiResponse from '../utils/api.response.js';

export async function crawl(req, res) {
    try {
        const { url } = req.body;
        
        if (!url) {
            const error = new ApiError(400, "Target URL is required");
            return res.status(error.statusCode).json(error);
        }

        clearDatabase(); 

        const chunks = await processWebsite(url);
        
        storeChunks(chunks);

        const responseData = { totalChunks: chunks.length, urlScraped: url };
        const response = new ApiResponse(200, responseData, "Website indexed successfully");
        
        res.status(response.statusCode).json(response);

    } catch (err) {
        console.error("Crawling Error:", err);
        const error = new ApiError(500, "Failed to process website content", [err.message]);
        res.status(error.statusCode).json(error);
    }
}