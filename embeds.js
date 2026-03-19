const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

/**
 * Builds the intercept embed explaining each mentioned role.
 * @param {import('discord.js').User} author
 * @param {Map<string, import('discord.js').Role>} protectedRoles
 * @param {Object} roleConfig
 * @param {string} originalContent
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildInterceptEmbed(author, protectedRoles, roleConfig, originalContent) {
  const embed = new EmbedBuilder()
    .setColor(0xf0a500)
    .setTitle('⚠️  Hold on — you\'re about to ping a team role')
    .setDescription(
      `Hey ${author}, your message was held because it mentioned one or more protected roles.\n\n` +
        `Before proceeding, here's what each role is responsible for:`
    )
    .setThumbnail(author.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setFooter({ text: 'This intercept expires in 5 minutes.' });

  for (const [roleId, role] of protectedRoles) {
    const config = roleConfig[roleId];
    embed.addFields({
      name: `${config.emoji}  @${config.name}`,
      value: [
        `**What they do:** ${config.description}`,
        `**When to tag them:** ${config.whenToTag}`,
        `**Response time:** ${config.responseTime}`,
      ].join('\n'),
    });
  }

  // Show a truncated version of the original message
  const preview =
    originalContent.length > 800
      ? originalContent.slice(0, 800) + '…'
      : originalContent;

  embed.addFields({
    name: '📝  Your original message',
    value: `\`\`\`${preview}\`\`\``,
  });

  embed.addFields({
    name: '👇  What would you like to do?',
    value:
      '**Confirm** — Send your message as-is, role pings included.\n' +
      '**Edit** — Revise your message before sending.\n' +
      '**Cancel** — Discard the message entirely.',
  });

  return embed;
}

/**
 * Builds the action row with Confirm / Edit / Cancel buttons.
 * @param {string} pendingId
 * @returns {import('discord.js').ActionRowBuilder}
 */
function buildActionRow(pendingId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm__${pendingId}`)
      .setLabel('✅  Yes, send it')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`edit__${pendingId}`)
      .setLabel('✏️  Edit message')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`cancel__${pendingId}`)
      .setLabel('🗑️  Cancel')
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = { buildInterceptEmbed, buildActionRow };
