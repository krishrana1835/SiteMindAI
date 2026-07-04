import { indexWebsite } from '../services/crawler.service.js';
import ApiError from '../utils/api.error.js';
import ApiResponse from '../utils/api.response.js';

export async function crawl(req, res) {
    try {
        const { url, force } = req.body;
        
        if (!url) {
            const error = new ApiError(400, "Target URL is required");
            return res.status(error.statusCode).json(error);
        }

        const result = await indexWebsite(url, force);

        console.log(`Indexing request for ${url}: ${result.message} (From Cache: ${result.fromCache}, In Progress: ${result.inProgress})`);

        const responseData = { 
            message: result.message, 
            site: result.site,
            fromCache: result.fromCache,
            inProgress: result.inProgress,
        };
        
        // Use 202 Accepted if indexing is in progress, 200 OK otherwise
        const statusCode = result.inProgress ? 202 : 200;
        const response = new ApiResponse(statusCode, responseData, result.message);
        
        res.status(response.statusCode).json(response);

    } catch (err) {
        console.error("Crawling Error:", err);
        const error = new ApiError(500, "Failed to process website content", [err.message]);
        res.status(error.statusCode).json(error);
    }
}
