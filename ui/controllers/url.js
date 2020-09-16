const protocol = 'http';
const host = process.env.ROBOKACHE_HOST || 'lvh.me';
const port = 8080;

/**
 * URL Maker
 * @param {string} ext extension to append to url
 */
const url = (ext) => `${protocol}://${host}:${port}/${ext}`;

module.exports = url;
