# Discord Broadcast Bot & Admin Console

A modernized, high-performance Discord message broadcasting solution featuring a premium web-based administrative console. Broadcast customized direct messages (DMs) to your server members with advanced targeting filters, speed configuration, and real-time event logging.

---

## ✨ Key Features

- **Modern ESModules Stack**: Built using Node.js ESModules and the latest stable `discord.js` v14 API.
- **Premium Web Dashboard**: A glassmorphic web administration panel served directly from the bot (`http://localhost:3000`).
- **Dynamic Filter Targeting**:
  - **All Members**: Deliver to every user in the server (excluding bots).
  - **Online Members**: Targets only active online members to maximize outreach engagement.
  - **Role-based Filtering**: Dynamically fetches your guild roles and targets specific groups of members.
- **Real-Time Monitoring (SSE)**: Streams delivery progress, success ratios, failure rates, and live terminal logs directly to your browser via Server-Sent Events.
- **Queue Controls**: Includes a "Cancel" action to instantly abort ongoing broadcasts.
- **Adjustable Throttling**: Configure the interval delay between messages (from 1s up to 10s) to fit your server size and comply with Discord rate-limiting guidelines.
- **Image Embed Support**: Attach rich visual images to your DM announcements.
- **Slash Commands**: Still includes native Discord support with the `/broadcast` command.

---

## 🛠️ Prerequisites & Setup

### 1. Developer Portal Configuration (Critical)
To list members and inspect online statuses, your bot client requires **Privileged Gateway Intents**.
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Choose your Bot Application and navigate to the **Bot** tab on the left menu.
3. Scroll down to the **Privileged Gateway Intents** section.
4. Toggle **ON** the following settings:
   - **Presence Intent** (needed for online checks)
   - **Server Members Intent** (needed to iterate guild list and send DMs)
5. Save your changes.

### 2. Project Installation
Clone this repository and install the modernized dependencies:

```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the project:

```env
TOKEN=your-discord-bot-token
CLIENT_ID=your-bot-client-application-id
GUILD_ID=your-target-discord-guild-id
PORT=3000
```

- **TOKEN**: Found under the "Bot" settings page in the Developer Portal.
- **CLIENT_ID**: Located under "General Information" (Application ID) or "OAuth2".
- **GUILD_ID**: Right-click your server's name in Discord (ensure Discord "Developer Mode" is enabled) and click **Copy Server ID**.
- **PORT**: Configures the port number for the Web Dashboard server (defaults to 3000).

---

## 🚀 Running the Bot

### Standard Mode
Start the server using standard npm scripts:

```bash
# Production Run
npm start

# Development watch mode
npm run dev
```

Once running, access the dashboard at:
👉 **[http://localhost:3000](http://localhost:3000)**

### 🐳 Running with Docker
You can easily build and run the bot inside a Docker container:

```bash
# Build the Docker image
docker build -t discord-broadcast-bot .

# Run the container (injecting your .env file)
docker run -d --name discord-broadcast -p 3000:3000 --env-file .env discord-broadcast-bot
```

---

## 🖥️ Web Dashboard Overview

The Web Dashboard divides administrative controls into two main segments:
1. **New Broadcast Creator (Left)**: Write your announcement text, paste an optional image attachment URL, choose target filter rules, and drag the interval speed slider.
2. **Live Monitor & Console (Right)**: Shows current status (`IDLE` / `BROADCASTING` / `COMPLETED` / `CANCELLED`), active success counters, progress percent, a red "Cancel" abort trigger, and a detailed terminal log showing specific user delivery feedback.

---

## 💬 Slash Commands

You can trigger a broadcast directly from the Discord interface using:

```
/broadcast [message] [filter: all|online|role] [image] [role]
```

*Note: Slash commands require administrator permissions within your server.*

---

## ⚖️ License & Contribution

Distributed under the MIT License. Feel free to open issues or file pull requests on GitHub.
