const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Register the slash commands
const commands = [
    {
        name: 'broadcast',
        description: 'Send a broadcast message to all server members via DM',
        options: [
            {
                name: 'message',
                type: 3, // String type
                description: 'The message to broadcast',
                required: true,
            },
            {
                name: 'image',
                type: 3, // String type
                description: 'URL of the image to include in the broadcast',
                required: false,
            },
        ],
    },
    {
        name: 'broadcast-test',
        description: 'Test a broadcast message by sending it only to yourself',
        options: [
            {
                name: 'message',
                type: 3, // String type
                description: 'The message to test',
                required: true,
            },
            {
                name: 'image',
                type: 3, // String type
                description: 'URL of the image to include in the test',
                required: false,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Successfully registered application (/) commands.');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
})();

// When the bot is ready
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

// Handle slash command interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'broadcast' || interaction.commandName === 'broadcast-test') {
        // Check if the user has Administrator permissions for broadcast (not needed for test)
        if (
            interaction.commandName === 'broadcast' &&
            !interaction.member.permissions.has('Administrator')
        ) {
            return interaction.reply({
                content: '🚫 You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        // Get the message and optional image URL from the command options
        const broadcastMessage = interaction.options.getString('message');
        const imageUrl = interaction.options.getString('image');

        // Create an embed for the broadcast message
        const embed = new EmbedBuilder()
            .setTitle('📢 Broadcast Message')
            .setDescription(broadcastMessage)
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({ text: `Sent by ${interaction.user.tag}` });

        // Add the image to the embed if an image URL is provided
        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        if (interaction.commandName === 'broadcast-test') {
            // Send the test message only to the command user
            try {
                await interaction.user.send({ embeds: [embed] });
                await interaction.reply({
                    content: '✅ Test broadcast message sent to you via DM!',
                    ephemeral: true,
                });
            } catch (error) {
                console.error('❌ Error sending test message:', error);
                await interaction.reply({
                    content: '❌ Failed to send the test broadcast message. Please check your DM settings.',
                    ephemeral: true,
                });
            }
        } else if (interaction.commandName === 'broadcast') {
            try {
                // Fetch all members in the guild
                const members = await interaction.guild.members.fetch();

                let successCount = 0;
                let failureCount = 0;

                // Send the embed message to each non-bot member
                for (const member of members.values()) {
                    if (!member.user.bot) {
                        try {
                            await member.send({ embeds: [embed] });
                            successCount++;
                        } catch (error) {
                            console.error(`❌ Could not DM ${member.user.tag}: ${error.message}`);
                            failureCount++;
                        }
                    }
                }

                // Reply to the admin with the broadcast result
                await interaction.reply(
                    `✅ Broadcast complete! Success: ${successCount}, Failed: ${failureCount}.`
                );
            } catch (error) {
                console.error('❌ Error broadcasting message:', error);
                await interaction.reply({
                    content: '❌ Failed to broadcast the message. Please try again later.',
                    ephemeral: true,
                });
            }
        }
    }
});

// Login to Discord
client.login(process.env.TOKEN);
