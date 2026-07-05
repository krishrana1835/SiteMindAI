import crypto from 'crypto';

// In-memory store for site metadata, scoped by session
const siteRegistry = new Map();

function getSessionStore(sessionId) {
    if (!siteRegistry.has(sessionId)) {
        siteRegistry.set(sessionId, new Map());
    }
    return siteRegistry.get(sessionId);
}

/**
 * Adds a new site to the registry for a given session.
 * @param {string} sessionId - The session ID.
 * @param {string} originalUrl - The original URL provided by the user.
 * @param {string} normalizedUrl - The normalized URL to be used as the cache key.
 * @param {string} [title] - The title of the website.
 * @returns {object} The newly created site object.
 */
function addSite(sessionId, originalUrl, normalizedUrl, title = '') {
  if (!normalizedUrl) throw new Error('Normalized URL is required to add a site.');
  const sessionStore = getSessionStore(sessionId);

  const site = {
    id: crypto.randomUUID(),
    originalUrl,
    normalizedUrl,
    status: 'indexing', // Initial status
    indexedAt: new Date(),
    chunkCount: 0,
    title,
  };

  sessionStore.set(normalizedUrl, site);
  return site;
}

/**
 * Retrieves a site by its normalized URL for a given session.
 * @param {string} sessionId - The session ID.
 * @param {string} normalizedUrl - The normalized URL of the site.
 * @returns {object|undefined} The site object or undefined if not found.
 */
function getSite(sessionId, normalizedUrl) {
  const sessionStore = getSessionStore(sessionId);
  return sessionStore.get(normalizedUrl);
}

/**
 * Updates an existing site's data for a given session.
 * @param {string} sessionId - The session ID.
 * @param {string} normalizedUrl - The normalized URL of the site to update.
 * @param {object} updates - An object containing the fields to update.
 * @returns {object|undefined} The updated site object or undefined if not found.
 */
function updateSite(sessionId, normalizedUrl, updates) {
  const sessionStore = getSessionStore(sessionId);
  if (!sessionStore.has(normalizedUrl)) {
    return undefined;
  }
  const existingSite = sessionStore.get(normalizedUrl);
  const updatedSite = { ...existingSite, ...updates };
  sessionStore.set(normalizedUrl, updatedSite);
  return updatedSite;
}

/**
 * Removes a site from the registry for a given session.
 * @param {string} sessionId - The session ID.
 * @param {string} normalizedUrl - The normalized URL of the site to remove.
 * @returns {boolean} True if the site was removed, false otherwise.
 */
function removeSite(sessionId, normalizedUrl) {
  const sessionStore = getSessionStore(sessionId);
  return sessionStore.delete(normalizedUrl);
}

/**
 * Checks if a site with "ready" status exists for a given session.
 * @param {string} sessionId - The session ID.
 * @param {string} normalizedUrl - The normalized URL of the.
 * @returns {boolean} True if the site is indexed and ready, false otherwise.
 */
function isIndexed(sessionId, normalizedUrl) {
  const sessionStore = getSessionStore(sessionId);
  const site = sessionStore.get(normalizedUrl);
  return !!site && site.status === 'ready';
}

/**
 * Finds all sites in the registry for a given session.
 * @param {string} sessionId - The session ID.
 * @returns {Array<object>} A list of all site objects.
 */
function findAllSites(sessionId) {
  const sessionStore = getSessionStore(sessionId);
  return Array.from(sessionStore.values());
}


export const siteStore = {
  addSite,
  getSite,
  updateSite,
  removeSite,
  isIndexed,
  findAllSites,
};
