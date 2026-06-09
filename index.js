import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Discord Client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const commands = [
    {
        name: 'broadcast',
        description: 'Send a broadcast message to server members via DM',
        options: [
            {
                name: 'message',
                type: 3, // String
                description: 'The message to broadcast',
                required: true,
            },
            {
                name: 'filter',
                type: 3, // String
                description: 'Filter recipients: online, role, or all',
                required: true,
                choices: [
                    { name: 'All Members', value: 'all' },
                    { name: 'Online Members', value: 'online' },
                    { name: 'Members with a Role', value: 'role' },
                ],
            },
            {
                name: 'image',
                type: 3, // String
                description: 'URL of the image to include in the broadcast',
                required: false,
            },
            {
                name: 'role',
                type: 8, // Role
                description: 'Role to filter (only required for role filter)',
                required: false,
            },
        ],
    },
];

// Unified state for active broadcasts
let activeBroadcast = {
    status: 'idle', // 'idle' | 'broadcasting' | 'completed' | 'cancelled'
    message: '',
    filter: '',
    roleId: null,
    imageUrl: '',
    sentCount: 0,
    failedCount: 0,
    totalCount: 0,
    logs: [],
    cancelRequested: false
};

const sseClients = new Set();

function addLog(type, text) {
    const logEntry = {
        timestamp: new Date().toLocaleTimeString(),
        type, // 'info' | 'success' | 'error'
        text
    };
    activeBroadcast.logs.push(logEntry);
    if (activeBroadcast.logs.length > 200) {
        activeBroadcast.logs.shift();
    }
    broadcastEvent('log', logEntry);
}

function broadcastEvent(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(clientRes => clientRes.write(payload));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBroadcast({ message, filter, roleId, imageUrl, delayMs = 1000 }) {
    if (activeBroadcast.status === 'broadcasting') {
        throw new Error('A broadcast is already in progress.');
    }

    activeBroadcast = {
        status: 'broadcasting',
        message,
        filter,
        roleId,
        imageUrl,
        sentCount: 0,
        failedCount: 0,
        totalCount: 0,
        logs: [],
        cancelRequested: false
    };
    
    broadcastEvent('status', activeBroadcast);
    addLog('info', `Starting broadcast: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    addLog('info', `Filter configuration: ${filter}${roleId ? ` (Role ID: ${roleId})` : ''} | Inter-message delay: ${delayMs}ms`);

    try {
        if (!client.readyAt) {
            throw new Error('Discord bot client is not connected.');
        }

        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        if (!guild) {
            throw new Error(`Target Guild (ID: ${process.env.GUILD_ID}) could not be resolved.`);
        }

        addLog('info', `Fetching members for guild "${guild.name}"...`);
        const members = await guild.members.fetch();
        
        let filteredMembers;
        if (filter === 'online') {
            filteredMembers = members.filter((member) => !member.user.bot && member.presence?.status === 'online');
        } else if (filter === 'role') {
            if (!roleId) {
                throw new Error('Role ID must be specified for role filtering.');
            }
            filteredMembers = members.filter((member) => !member.user.bot && member.roles.cache.has(roleId));
        } else {
            filteredMembers = members.filter((member) => !member.user.bot);
        }

        activeBroadcast.totalCount = filteredMembers.size;
        broadcastEvent('status', activeBroadcast);
        addLog('info', `Target audience: ${filteredMembers.size} member(s) found.`);

        const embed = new EmbedBuilder()
            .setTitle('📢 Server Broadcast')
            .setDescription(message)
            .setColor(0x6366f1) // Premium Indigo accent
            .setTimestamp()
            .setFooter({ text: `From ${guild.name}` });

        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        for (const member of filteredMembers.values()) {
            if (activeBroadcast.cancelRequested) {
                activeBroadcast.status = 'cancelled';
                addLog('error', 'Broadcast sequence terminated by administrator.');
                broadcastEvent('status', activeBroadcast);
                return;
            }

            try {
                await member.send({ embeds: [embed] });
                activeBroadcast.sentCount++;
                addLog('success', `Delivered to ${member.user.tag}`);
            } catch (err) {
                activeBroadcast.failedCount++;
                addLog('error', `Failed for ${member.user.tag}: ${err.message}`);
            }

            broadcastEvent('status', activeBroadcast);
            await delay(delayMs);
        }

        activeBroadcast.status = 'completed';
        addLog('success', `Broadcast sequence complete! Sent: ${activeBroadcast.sentCount}, Failed: ${activeBroadcast.failedCount}`);
        broadcastEvent('status', activeBroadcast);
    } catch (error) {
        console.error('Broadcast Execution Error:', error);
        activeBroadcast.status = 'idle';
        addLog('error', `Execution failed: ${error.message}`);
        broadcastEvent('status', activeBroadcast);
    }
}

// Register Discord Application Commands
async function registerSlashCommands() {
    if (!process.env.TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
        console.warn('⚠️ Environment parameters (TOKEN, CLIENT_ID, GUILD_ID) are incomplete. Command registration skipped.');
        return;
    }
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('🔄 Syncing slash commands with Discord API...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Slash commands successfully synchronized.');
    } catch (error) {
        console.error('❌ Failed to register slash commands:', error);
    }
}

client.once('ready', () => {
    console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
    registerSlashCommands();
});

// Handle Slash Commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'broadcast') {
        // Enforce administrative permissions
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '🚫 You must have Administrator privileges to execute broadcasts.',
                ephemeral: true
            });
        }

        if (activeBroadcast.status === 'broadcasting') {
            return interaction.reply({
                content: '❌ A broadcast is already running. Please wait or cancel the current task via the Web Dashboard.',
                ephemeral: true
            });
        }

        const message = interaction.options.getString('message');
        const filter = interaction.options.getString('filter');
        const imageUrl = interaction.options.getString('image');
        const role = interaction.options.getRole('role');

        if (filter === 'role' && !role) {
            return interaction.reply({
                content: '❌ Please specify a role filter option.',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: '📢 Broadcast triggered! Tracking progress on the administration dashboard.',
            ephemeral: true
        });

        // Trigger sequence asynchronously
        runBroadcast({
            message,
            filter,
            roleId: role ? role.id : null,
            imageUrl,
            delayMs: 1000
        }).catch(console.error);
    }
});

// Setup Web Administration Dashboard & Express Server
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Retrieve Current Dashboard Connection Status
app.get('/api/status', (req, res) => {
    const guild = client.readyAt ? client.guilds.cache.get(process.env.GUILD_ID) : null;
    res.json({
        botName: client.user?.tag || 'Offline',
        botAvatar: client.user?.displayAvatarURL() || null,
        status: client.readyAt ? 'online' : 'offline',
        ping: client.readyAt ? client.ws.ping : 0,
        guildName: guild ? guild.name : 'Unknown/Disconnected Guild',
        memberCount: guild ? guild.memberCount : 0,
        activeBroadcast: {
            status: activeBroadcast.status,
            sentCount: activeBroadcast.sentCount,
            failedCount: activeBroadcast.failedCount,
            totalCount: activeBroadcast.totalCount
        }
    });
});

// Fetch Available Guild Roles
app.get('/api/roles', async (req, res) => {
    try {
        if (!client.readyAt) {
            return res.status(503).json({ error: 'Discord Client is currently offline.' });
        }
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        if (!guild) {
            return res.status(404).json({ error: 'Guild could not be resolved.' });
        }
        const roles = guild.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            }));
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger Broadcast
app.post('/api/broadcast', (req, res) => {
    const { message, filter, roleId, imageUrl, delay } = req.body;
    
    if (!message || !filter) {
        return res.status(400).json({ error: 'Message and filter parameters are required.' });
    }
    if (activeBroadcast.status === 'broadcasting') {
        return res.status(400).json({ error: 'Another broadcast is currently in progress.' });
    }

    const delayMs = Math.max(500, parseInt(delay, 10) * 1000 || 1000); // minimum 500ms delay

    runBroadcast({
        message,
        filter,
        roleId,
        imageUrl,
        delayMs
    }).catch(console.error);

    res.json({ success: true, message: 'Broadcast initialized.' });
});

// Abort Active Broadcast
app.post('/api/broadcast/cancel', (req, res) => {
    if (activeBroadcast.status !== 'broadcasting') {
        return res.status(400).json({ error: 'No active broadcast is running.' });
    }
    activeBroadcast.cancelRequested = true;
    addLog('info', 'Received cancel instruction from administrator. Terminating...');
    res.json({ success: true, message: 'Cancellation request received.' });
});

// Server-Sent Events Endpoint for live stats
app.get('/api/progress', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Initialize stream with current state
    res.write(`event: status\ndata: ${JSON.stringify(activeBroadcast)}\n\n`);
    
    sseClients.add(res);
    
    req.on('close', () => {
        sseClients.delete(res);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Web Administration Dashboard active on http://localhost:${PORT}`);
});

// Connect Bot
if (process.env.TOKEN) {
    client.login(process.env.TOKEN).catch(error => {
        console.error('❌ Failed to authenticate with Discord Client:', error.message);
    });
} else {
    console.warn('❌ Token missing. Check your local configuration properties.');
}
