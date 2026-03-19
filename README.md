# Discord Role Intercept Bot

A Discord bot that watches every message across a server. When a user mentions a protected role, their message is **silently deleted** before the ping fires, and they're shown an informational embed explaining what that role is responsible for — then prompted to **confirm**, **edit**, or **cancel** their message.

When confirmed or edited, the message is reposted via a webhook so it appears under the **user's own name and avatar**.

---

## Features

- 🛡️ **Intercepts role pings** before they notify anyone
- 📋 **Explains each role** — what they do, when to tag them, expected response time
- ✅ **Confirm** — reposts the original message exactly as written, pings included
- ✏️ **Edit** — opens a pre-filled Discord modal so the user can revise before sending
- 🗑️ **Cancel** — discards the message entirely
- 👤 **Webhook reposting** — confirmed/edited messages appear under the user's name & avatar
- ⏳ **5-minute expiry** — intercepts auto-expire to prevent stale interactions
- 🔒 **Author-only interactions** — other users can't click the buttons

---

## Setup

### 1. Create a Discord Application & Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it → go to the **Bot** tab
3. Click **Reset Token** and copy your token
4. Under **Privileged Gateway Intents**, enable:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**

### 2. Invite the Bot to Your Server

In the Developer Portal, go to **OAuth2 → URL Generator**:

**Scopes:** `bot`, `applications.commands`

**Bot Permissions:**
- Read Messages / View Channels
- Send Messages
- Manage Messages *(required to delete intercepted messages)*
- Embed Links
- Manage Webhooks *(required to repost as the original user)*
- Read Message History

Copy the generated URL and open it to invite the bot.

### 3. Install & Configure

```bash
# Clone or download this project, then:
cd discord-role-intercept-bot
npm install

# Set up environment
cp .env.example .env
# Edit .env and paste your bot token
```

### 4. Configure Protected Roles

Edit `roleConfig.json`. For each role you want to protect, add an entry:

```json
{
  "ROLE_ID": {
    "name": "Moderators",
    "emoji": "🛡️",
    "description": "What this role does.",
    "whenToTag": "Correct situations to tag them.",
    "responseTime": "How fast they typically respond."
  }
}
```

**To find a Role ID:**
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click the role in Server Settings → Roles → Copy Role ID

### 5. Run the Bot

```bash
npm start

# Or for development with auto-restart:
npm run dev
```

---

## Project Structure

```
discord-role-intercept-bot/
├── index.js                    # Bot entry point
├── roleConfig.json             # Role IDs + descriptions (edit this!)
├── package.json
├── .env.example
├── handlers/
│   ├── messageHandler.js       # Watches messages, fires intercept logic
│   └── interactionHandler.js  # Handles button clicks and modal submissions
├── store/
│   └── pendingMessages.js      # In-memory store for intercepted messages
└── utils/
    ├── embeds.js               # Builds the intercept embed and buttons
    └── webhook.js              # Gets/creates webhooks, reposts as user
```

---

## How It Works

```
User sends message with @ProtectedRole
        │
        ▼
Bot deletes message (before ping fires)
        │
        ▼
Bot posts intercept embed in channel
  - Explains each tagged role
  - Shows original message preview
  - Buttons: [Confirm] [Edit] [Cancel]
        │
   ┌────┴────────────────┐
   │                     │
[Confirm]             [Edit]                [Cancel]
   │                     │                     │
Repost via           Open modal           Delete intercept
webhook as           (pre-filled)         embed, discard msg
original user           │
                   User edits & submits
                        │
                   Repost via webhook
                   as original user
```

---

## Notes

- The bot needs **Manage Messages** permission in every channel you want it to monitor. If it lacks this in a channel, it will skip interception there and log a warning.
- Confirmed/edited messages are posted via a **Discord webhook**, so they appear under the user's own name and avatar — not the bot's name.
- Intercepted message state is held **in memory** — if the bot restarts, pending messages are lost. For persistence across restarts, swap `store/pendingMessages.js` for a Redis or SQLite implementation.
