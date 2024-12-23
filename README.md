# Discord Broadcast Bot

A Discord bot that allows administrators to broadcast messages to all server members via DM, with support for testing broadcasts and including images.

## Features
- **Broadcast to All Members**: Send a custom message or an embed to all members of a server (except bots).
- **Broadcast Test**: Test your broadcast by sending the message only to yourself to preview how it looks.
- **Embeds**: Include visually appealing embeds with titles, descriptions, and optional images.
- **Permission Checks**: Ensures only administrators can broadcast messages to all members.
- **Error Handling**: Gracefully handles errors, such as members with closed DMs.

## Commands

### `/broadcast`
Broadcast a message to all server members via DM.

#### Options:
- `message` *(required)*: The message content to broadcast.
- `image` *(optional)*: A URL to an image to include in the broadcast.

#### Example:
```bash
/broadcast message: Hello, everyone! Here's an important announcement. image: https://example.com/image.png
```
/broadcast-test
Test your broadcast by sending the message only to yourself via DM.

Options:
message (required): The message content to test.
image (optional): A URL to an image to include in the test.
Example:
```bash
/broadcast-test message: This is a test message. image: https://example.com/test-image.png
```

# Created by: @achrafthedev
