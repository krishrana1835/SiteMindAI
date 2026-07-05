import { indexWebsite, removeSiteFromIndex, getAllIndexedSites } from '../services/crawler.service.js';
import ApiError from '../utils/api.error.js';
import ApiResponse from '../utils/api.response.js';

export async function crawl(req, res) {
    try {
        const { url, force } = req.body;
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            const error = new ApiError(400, "Session ID is required");
            return res.status(error.statusCode).json(error);
        }
        
        if (!url) {
            const error = new ApiError(400, "Target URL is required");
            return res.status(error.statusCode).json(error);
        }

        const result = await indexWebsite(sessionId, url, force);

        console.log(`Indexing request for ${url}: ${result.message} (From Cache: ${result.fromCache}, In Progress: ${result.inProgress})`);

        const responseData = { 
            message: result.message, 
            site: result.site,
            fromCache: result.fromCache,
            inProgress: result.inProgress,
        };
        
        const statusCode = result.inProgress ? 202 : 200;
        const response = new ApiResponse(statusCode, responseData, result.message);
        
        res.status(response.statusCode).json(response);

    } catch (err) {
        console.error("Crawling Error:", err);
        const error = new ApiError(500, "Failed to process website content", [err.message]);
        res.status(error.statusCode).json(error);
    }
}

export async function removeSite(req, res) {
    try {
        const { url } = req.body;
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            const error = new ApiError(400, "Session ID is required");
            return res.status(error.statusCode).json(error);
        }

        if (!url) {
            const error = new ApiError(400, "Target URL is required");
            return res.status(error.statusCode).json(error);
        }

        const result = await removeSiteFromIndex(sessionId, url);

        const response = new ApiResponse(200, result, result.message);
        
        res.status(response.statusCode).json(response);

    } catch (err) {
        console.error("Removal Error:", err);
        const error = new ApiError(500, "Failed to remove website", [err.message]);
        res.status(error.statusCode).json(error);
    }
}

export function getSites(req, res) {
    try {
        const sessionId = req.headers['x-session-id'];

        if (!sessionId) {
            const error = new ApiError(400, "Session ID is required");
            return res.status(error.statusCode).json(error);
        }

        const sites = getAllIndexedSites(sessionId);
        const response = new ApiResponse(200, sites, "Successfully retrieved indexed sites.");
        res.status(response.statusCode).json(response);
    } catch (err) {
        console.error("Get Sites Error:", err);
        const error = new ApiError(500, "Failed to retrieve indexed sites", [err.message]);
        res.status(error.statusCode).json(error);
    }
}
