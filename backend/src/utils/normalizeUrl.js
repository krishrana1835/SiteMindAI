function normalizeUrl(urlString) {
  if (!urlString) return null;

  try {
    const url = new URL(urlString);

    // 1. Force protocol to https
    url.protocol = 'https';

    // 2. Remove 'www.' prefix from hostname
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.substring(4);
    }

    // 3. Remove trailing slash from pathname
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.substring(0, url.pathname.length - 1);
    }

    // 4. Remove search params and hash
    url.search = '';
    url.hash = '';

    return url.toString();
  } catch (error) {
    console.error('Invalid URL:', urlString, error);
    return null;
  }
}

export { normalizeUrl };
