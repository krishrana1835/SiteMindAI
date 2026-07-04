import crypto from 'crypto';

// In-memory store for site metadata
const siteRegistry = new Map();

/**
 * Adds a new site to the registry.
 * @param {string} originalUrl - The original URL provided by the user.
 * @param {string} normalizedUrl - The normalized URL to be used as the cache key.
 * @param {string} [title] - The title of the website.
 * @returns {object} The newly created site object.
 */
function addSite(originalUrl, normalizedUrl, title = '') {
  if (!normalizedUrl) throw new Error('Normalized URL is required to add a site.');

  const site = {
    id: crypto.randomUUID(),
    originalUrl,
    normalizedUrl,
    status: 'indexing', // Initial status
    indexedAt: new Date(),
    chunkCount: 0,
    title,
  };

  siteRegistry.set(normalizedUrl, site);
  return site;
}

/**
 * Retrieves a site by its normalized URL.
 * @param {string} normalizedUrl - The normalized URL of the site.
 * @returns {object|undefined} The site object or undefined if not found.
 */
function getSite(normalizedUrl) {
  return siteRegistry.get(normalizedUrl);
}

/**
 * Updates an existing site's data.
 * @param {string} normalizedUrl - The normalized URL of the site to update.
 * @param {object} updates - An object containing the fields to update.
 * @returns {object|undefined} The updated site object or undefined if not found.
 */
function updateSite(normalizedUrl, updates) {
  if (!siteRegistry.has(normalizedUrl)) {
    return undefined;
  }
  const existingSite = siteRegistry.get(normalizedUrl);
  const updatedSite = { ...existingSite, ...updates };
  siteRegistry.set(normalizedUrl, updatedSite);
  return updatedSite;
}

/**
 * Removes a site from the registry.
 * @param {string} normalizedUrl - The normalized URL of the site to remove.
 * @returns {boolean} True if the site was removed, false otherwise.
 */
function removeSite(normalizedUrl) {
  return siteRegistry.delete(normalizedUrl);
}

/**
 * Checks if a site with "ready" status exists.
 * @param {string} normalizedUrl - The normalized URL of the site.
 * @returns {boolean} True if the site is indexed and ready, false otherwise.
 */
function isIndexed(normalizedUrl) {
  const site = siteRegistry.get(normalizedUrl);
  return !!site && site.status === 'ready';
}

/**
 * Finds all sites in the registry.
 * @returns {Array<object>} A list of all site objects.
 */
function findAllSites() {
  return Array.from(siteRegistry.values());
}


export const siteStore = {
  addSite,
  getSite,
  updateSite,
  removeSite,
  isIndexed,
  findAllSites,
};
