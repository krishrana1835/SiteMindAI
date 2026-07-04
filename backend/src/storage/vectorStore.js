// In-memory store for vector chunks, grouped by siteId
const vectorStore = new Map();

/**
 * Saves chunks for a specific site.
 * @param {string} siteId - The ID of the site.
 * @param {Array<object>} chunks - An array of chunk objects to save.
 * Each chunk should contain: siteId, text, embedding, metadata.
 */
function saveChunks(siteId, chunks) {
  if (!vectorStore.has(siteId)) {
    vectorStore.set(siteId, []);
  }
  const existingChunks = vectorStore.get(siteId);
  vectorStore.set(siteId, [...existingChunks, ...chunks]);
}

/**
 * Retrieves all chunks for a specific site.
 * @param {string} siteId - The ID of the site.
 * @returns {Array<object>} An array of chunks for the site, or an empty array if not found.
 */
function getChunks(siteIds) {
  if (!siteIds) { // if no siteIds are passed, return all chunks from all sites
    const allChunks = [];
    for (const chunks of vectorStore.values()) {
        allChunks.push(...chunks);
    }
    return allChunks;
  }
  
  if (Array.isArray(siteIds)) {
    const combinedChunks = [];
    for (const siteId of siteIds) {
      combinedChunks.push(...(vectorStore.get(siteId) || []));
    }
    return combinedChunks;
  }
  
  return vectorStore.get(siteIds) || []; // For backward compatibility, if a single siteId string is passed
}

/**
 * Deletes all chunks for a specific site.
 * @param {string} siteId - The ID of the site.
 * @returns {boolean} True if the chunks were deleted, false otherwise.
 */
function deleteChunks(siteId) {
  return vectorStore.delete(siteId);
}

export const vectorStoreService = {
  saveChunks,
  getChunks,
  deleteChunks,
};
