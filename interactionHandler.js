const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const pendingMessages = require('../store/pendingMessages');
const { postAsUser } = require('../utils/webhook');

/**
 * Central interaction router.
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').Client} client
 */
async function handleInteraction(interaction, client) {
  if (interaction.isButton()) {
    return handleButton(interaction, client);
  }
  if (interaction.isModalSubmit()) {
    return handleModalSubmit(interaction, client);
  }
}

// ---------------------------------------------------------------------------
// Button handler
// ---------------------------------------------------------------------------

async function handleButton(interaction, client) {
  const [action, , pendingId] = interaction.customId.split('__');
  // customId format: "action__pendingId"
  const resolvedId = interaction.customId.replace(/^(confirm|edit|cancel)__/, '');

  const pending = pendingMessages.get(resolvedId);

  if (!pending) {
    return interaction.reply({
      content: '⏳ This intercept has expired (5-minute limit). Please resend your message.',
      ephemeral: true,
    });
  }

  // Only the original author may interact
  if (interaction.user.id !== pending.authorId) {
    return interaction.reply({
      content: '🚫 Only the person whose message was intercepted can interact with this.',
      ephemeral: true,
    });
  }

  const actionName = interaction.customId.split('__')[0];

  if (actionName === 'confirm') {
    await handleConfirm(interaction, resolvedId, pending, client);
  } else if (actionName === 'edit') {
    await handleEdit(interaction, resolvedId, pending);
  } else if (actionName === 'cancel') {
    await handleCancel(interaction, resolvedId);
  }
}

// ---------------------------------------------------------------------------
// Confirm — repost the message as the user via webhook
// ---------------------------------------------------------------------------

async function handleConfirm(interaction, pendingId, pending, client) {
  pendingMessages.remove(pendingId);

  // Disable buttons on the intercept message
  await disableButtons(interaction);

  const channel = await client.channels.fetch(pending.channelId);

  await postAsUser(channel, pending.content, {
    username: pending.authorUsername,
    avatarURL: pending.authorAvatarURL,
  });

  await interaction.reply({
    content: '✅ Your message has been sent.',
    ephemeral: true,
  });

  // Clean up the intercept embed after a short delay
  setTimeout(() => interaction.message.delete().catch(() => {}), 3000);
}

// ---------------------------------------------------------------------------
// Edit — show a pre-filled modal
// ---------------------------------------------------------------------------

async function handleEdit(interaction, pendingId, pending) {
  const modal = new ModalBuilder()
    .setCustomId(`editmodal__${pendingId}`)
    .setTitle('Edit your message');

  const input = new TextInputBuilder()
    .setCustomId('editedContent')
    .setLabel('Revise your message below:')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(pending.content)
    .setMaxLength(2000)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  await interaction.showModal(modal);
}

// ---------------------------------------------------------------------------
// Cancel — discard the pending message
// ---------------------------------------------------------------------------

async function handleCancel(interaction, pendingId) {
  pendingMessages.remove(pendingId);

  await disableButtons(interaction);

  await interaction.reply({
    content: '🗑️ Your message has been discarded.',
    ephemeral: true,
  });

  setTimeout(() => interaction.message.delete().catch(() => {}), 3000);
}

// ---------------------------------------------------------------------------
// Modal submit — post the edited message
// ---------------------------------------------------------------------------

async function handleModalSubmit(interaction, client) {
  const pendingId = interaction.customId.replace('editmodal__', '');
  const pending = pendingMessages.get(pendingId);

  if (!pending) {
    return interaction.reply({
      content: '⏳ This intercept has expired. Please resend your original message.',
      ephemeral: true,
    });
  }

  const newContent = interaction.fields.getTextInputValue('editedContent');
  pendingMessages.remove(pendingId);

  const channel = await client.channels.fetch(pending.channelId);

  await postAsUser(channel, newContent, {
    username: pending.authorUsername,
    avatarURL: pending.authorAvatarURL,
  });

  await interaction.reply({
    content: '✅ Your edited message has been sent.',
    ephemeral: true,
  });

  // Clean up the intercept embed
  setTimeout(() => interaction.message.delete().catch(() => {}), 3000);
}

// ---------------------------------------------------------------------------
// Helper: disable all buttons on an intercept message
// ---------------------------------------------------------------------------

async function disableButtons(interaction) {
  const disabledRows = interaction.message.components.map((row) => {
    const newRow = new ActionRowBuilder();
    newRow.addComponents(
      row.components.map((btn) =>
        btn.toJSON
          ? { ...btn.toJSON(), disabled: true }
          : btn
      )
    );
    return newRow;
  });

  await interaction.message.edit({ components: disabledRows }).catch(() => {});
}

module.exports = { handleInteraction };
