
# Discord Broadcast Bot

A powerful Discord bot to broadcast messages via DM to server members with advanced filtering options. Ideal for server administrators who need to communicate directly with specific groups of members.

## Features

- **Broadcast Messages**: Send messages via DM to all server members or filtered groups.
- **Filters**:
  - All Members
  - Online Members
  - Members with a Specific Role
- **Embed Support**: Include a title, description, and optional image in your messages.
- **Feedback**: Real-time feedback after every message sent.
- **Graceful Error Handling**: Skips members with closed DMs or other issues and logs errors.

## Prerequisites

- **Node.js**: Install [Node.js](https://nodejs.org/) (v16.6.0 or higher).
- **Discord Developer Account**: Create a bot on the [Discord Developer Portal](https://discord.com/developers/applications).

## Setup

### Clone the Repository

```bash
git clone https://github.com/achrafthedev/discordbroadcast.git
cd discordbroadcast
```

### Install Dependencies

```bash
npm install
```

### Create a `.env` File

Create a `.env` file in the root directory and add the following:

```
TOKEN=your-bot-token
CLIENT_ID=your-bot-client-id
GUILD_ID=your-server-id
```

Replace the placeholders with:
- `your-bot-token`: Found in the Discord Developer Portal under "Bot".
- `your-bot-client-id`: Found in the "OAuth2" section of your application.
- `your-server-id`: Right-click your server name in Discord (with Developer Mode enabled) and copy the ID.

## Usage

### Start the Bot

Run the following command to start the bot:

```bash
node index.js
```

### Slash Commands

#### `/broadcast`

Broadcast a message to server members.

**Options**:
- `message` *(required)*: The message content to broadcast.
- `filter` *(required)*: Choose between `all`, `online`, or `role`.
- `image` *(optional)*: URL to an image to include in the broadcast.
- `role` *(optional)*: The role to filter by (only required if `filter` is `role`).

**Examples**:
- Broadcast to all members:
  ```
  /broadcast message: Hello, everyone! filter: all
  ```
- Broadcast to online members only:
  ```
  /broadcast message: Hello, online members! filter: online
  ```
- Broadcast to members with a specific role:
  ```
  /broadcast message: Hello, role members! filter: role role: @RoleName
  ```

## License

This project is licensed under the MIT License.

## Contributing

Feel free to fork the repository and submit pull requests to improve this bot.

## Issues

If you encounter any issues, please open an issue on the [GitHub repository](https://github.com/achrafthedev/discordbroadcast/issues).
