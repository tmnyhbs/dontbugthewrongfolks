const roleConfig = require('../roleConfig.json');
const pendingMessages = require('../store/pendingMessages');
const { buildInterceptEmbed, buildActionRow } = require('../utils/embeds');

/**
 * Handles every new message in the server.
 * If it mentions a protected role, the message is deleted and an intercept prompt is shown.
 *
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 */
async function handleMessageCreate(message, client) {
  // Ignore bots and DMs
  if (message.author.bot) return;
  if (!message.guild) return;

  // Check for role mentions
  const mentionedRoles = message.mentions.roles;
  if (!mentionedRoles.size) return;

  // Filter to only roles listed in roleConfig.json
  const protectedRoles = mentionedRoles.filter((role) => roleConfig[role.id]);
  if (!protectedRoles.size) return;

  // Check bot has permission to manage messages in this channel
  const botMember = message.guild.members.me;
  if (!message.channel.permissionsFor(botMember).has('ManageMessages')) {
    console.warn(
      `[WARN] Missing ManageMessages permission in #${message.channel.name}`
    );
    return;
  }

  // Delete the original message before the ping fires
  try {
    await message.delete();
  } catch (err) {
    console.error('[ERROR] Could not delete original message:', err.message);
    return;
  }

  // Generate a unique ID for this pending entry
  const pendingId = `${message.author.id}-${Date.now()}`;

  // Build and send the intercept prompt
  const embed = buildInterceptEmbed(
    message.author,
    protectedRoles,
    roleConfig,
    message.content
  );
  const row = buildActionRow(pendingId);

  let botMessage;
  try {
    botMessage = await message.channel.send({
      content: `${message.author} — your message was intercepted before it could ping a team role.`,
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    console.error('[ERROR] Could not send intercept message:', err.message);
    return;
  }

  // Store pending message data
  pendingMessages.set(pendingId, {
    content: message.content,
    channelId: message.channel.id,
    authorId: message.author.id,
    authorUsername: message.member?.displayName ?? message.author.username,
    authorAvatarURL: message.author.displayAvatarURL({ dynamic: true }),
    botMessageId: botMessage.id,
  });

  console.log(
    `[INTERCEPT] ${message.author.tag} in #${message.channel.name} — pendingId: ${pendingId}`
  );
}

module.exports = { handleMessageCreate };
