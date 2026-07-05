// In-memory store for vector chunks, scoped by session
const sessionVectorStores = new Map();

function getSessionStore(sessionId) {
    if (!sessionVectorStores.has(sessionId)) {
        sessionVectorStores.set(sessionId, new Map());
    }
    return sessionVectorStores.get(sessionId);
}

/**
 * Saves chunks for a specific site within a session.
 * @param {string} sessionId - The session ID.
 * @param {string} siteId - The ID of the site.
 * @param {Array<object>} chunks - An array of chunk objects to save.
 */
function saveChunks(sessionId, siteId, chunks) {
  const vectorStore = getSessionStore(sessionId);
  if (!vectorStore.has(siteId)) {
    vectorStore.set(siteId, []);
  }
  const existingChunks = vectorStore.get(siteId);
  vectorStore.set(siteId, [...existingChunks, ...chunks]);
}

/**
 * Retrieves chunks for one or more sites within a session.
 * @param {string} sessionId - The session ID.
 * @param {string|string[]} [siteIds] - A single site ID, an array of site IDs, or undefined to get all chunks for the session.
 * @returns {Array<object>} An array of chunks.
 */
function getChunks(sessionId, siteIds) {
  const vectorStore = getSessionStore(sessionId);

  if (!siteIds) { // if no siteIds are passed, return all chunks from all sites in the session
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
  
  return vectorStore.get(siteIds) || []; // For backward compatibility
}

/**
 * Deletes all chunks for a specific site within a session.
 * @param {string} sessionId - The session ID.
 * @param {string} siteId - The ID of the site.
 * @returns {boolean} True if the chunks were deleted, false otherwise.
 */
function deleteChunks(sessionId, siteId) {
  const vectorStore = getSessionStore(sessionId);
  return vectorStore.delete(siteId);
}

export const vectorStoreService = {
  saveChunks,
  getChunks,
  deleteChunks,
};
