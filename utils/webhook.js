// Cache webhooks per channel to avoid repeated API calls
const webhookCache = new Map();

/**
 * Gets or creates a webhook for the given channel.
 * Uses a cached webhook where possible.
 * @param {import('discord.js').TextChannel} channel
 * @returns {Promise<import('discord.js').Webhook>}
 */
async function getOrCreateWebhook(channel) {
  if (webhookCache.has(channel.id)) {
    return webhookCache.get(channel.id);
  }

  // Fetch existing webhooks created by this bot
  const webhooks = await channel.fetchWebhooks();
  let webhook = webhooks.find((wh) => wh.owner?.id === channel.client.user.id);

  if (!webhook) {
    webhook = await channel.createWebhook({
      name: 'Role Intercept Bot',
      reason: 'Used to repost confirmed user messages after role-mention interception.',
    });
  }

  webhookCache.set(channel.id, webhook);
  return webhook;
}

/**
 * Posts a message through a webhook, mimicking the original user's appearance.
 * @param {import('discord.js').TextChannel} channel
 * @param {string} content
 * @param {{ username: string, avatarURL: string }} author
 */
async function postAsUser(channel, content, author) {
  const webhook = await getOrCreateWebhook(channel);
  await webhook.send({
    content,
    username: author.username,
    avatarURL: author.avatarURL,
    allowedMentions: { parse: ['roles', 'users', 'everyone'] },
  });
}

module.exports = { postAsUser };
