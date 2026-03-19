// Stores intercepted messages awaiting user confirmation or edits
// key: pendingId (string), value: PendingMessage object
// Entries are cleaned up after interaction or after TTL expires

const store = new Map();
const TTL_MS = 5 * 60 * 1000; // 5 minutes before a pending message expires

/**
 * @typedef {Object} PendingMessage
 * @property {string} content - Original message content
 * @property {string} channelId
 * @property {string} authorId
 * @property {string} authorUsername
 * @property {string} authorAvatarURL
 * @property {string} botMessageId - The ID of the bot's intercept message
 * @property {number} createdAt - Timestamp for TTL
 */

function set(pendingId, data) {
  store.set(pendingId, { ...data, createdAt: Date.now() });
}

function get(pendingId) {
  const entry = store.get(pendingId);
  if (!entry) return null;
  // Expire old entries
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(pendingId);
    return null;
  }
  return entry;
}

function remove(pendingId) {
  store.delete(pendingId);
}

// Periodically clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(id);
    }
  }
}, 60_000);

module.exports = { set, get, remove };
