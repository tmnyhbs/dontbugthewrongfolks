require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { handleMessageCreate } = require('./handlers/messageHandler');
const { handleInteraction } = require('./handlers/interactionHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildWebhooks,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`📡 Watching ${client.guilds.cache.size} server(s)`);
});

client.on('messageCreate', (message) => handleMessageCreate(message, client));
client.on('interactionCreate', (interaction) => handleInteraction(interaction, client));

client.login(process.env.DISCORD_TOKEN);
