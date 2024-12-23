const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] });

// Register the slash commands
const commands = [
    {
        name: 'broadcast',
        description: 'Send a broadcast message to server members via DM',
        options: [
            {
                name: 'message',
                type: 3, // String type
                description: 'The message to broadcast',
                required: true, // Required option
            },
            {
                name: 'filter',
                type: 3, // String type
                description: 'Filter recipients: online, role, or all',
                required: true, // Required option
                choices: [
                    { name: 'All Members', value: 'all' },
                    { name: 'Online Members', value: 'online' },
                    { name: 'Members with a Role', value: 'role' },
                ],
            },
            {
                name: 'image',
                type: 3, // String type
                description: 'URL of the image to include in the broadcast',
                required: false, // Optional option
            },
            {
                name: 'role',
                type: 8, // Role type
                description: 'Role to filter (only required for role filter)',
                required: false, // Optional option
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

client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

// Helper function to introduce delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'broadcast') {
        // Check if the user has Administrator permissions
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '🚫 You do not have permission to use this command.',
                ephemeral: true,
            });
        }

        // Get command options
        const broadcastMessage = interaction.options.getString('message');
        const imageUrl = interaction.options.getString('image');
        const filter = interaction.options.getString('filter');
        const role = interaction.options.getRole('role');

        const embed = new EmbedBuilder()
            .setTitle('📢 - Broadcast Message!')
            .setDescription(broadcastMessage)
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({ text: `Sent by ${interaction.user.tag}` });

        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        try {
            const members = await interaction.guild.members.fetch();

            // Apply filters
            let filteredMembers;
            if (filter === 'online') {
                filteredMembers = members.filter((member) => member.presence?.status === 'online');
            } else if (filter === 'role') {
                if (!role) {
                    return interaction.reply({
                        content: '❌ You must specify a role for the "role" filter.',
                        ephemeral: true,
                    });
                }
                filteredMembers = members.filter((member) => member.roles.cache.has(role.id));
            } else {
                filteredMembers = members.filter((member) => !member.user.bot);
            }

            // Notify the user about the broadcast start
            await interaction.reply({
                content: `📢 Broadcast started! Sending messages to ${filteredMembers.size} members...`,
                ephemeral: true,
            });

            let successCount = 0;
            let failureCount = 0;

            for (const member of filteredMembers.values()) {
                try {
                    await member.send({ embeds: [embed] });
                    successCount++;
                    await interaction.followUp({
                        content: `✅ Sent to ${member.user.tag} (${successCount}/${filteredMembers.size})`,
                        ephemeral: true,
                    });
                } catch (error) {
                    console.error(`❌ Could not DM ${member.user.tag}: ${error.message}`);
                    failureCount++;
                }
                await delay(1000); // Delay of 1 second between messages
            }

            await interaction.followUp({
                content: `✅ Broadcast complete! Success: ${successCount}, Failed: ${failureCount}.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('❌ Error during broadcast:', error);
            await interaction.reply({
                content: '❌ An error occurred during the broadcast. Please try again later.',
                ephemeral: true,
            });
        }
    }
});

client.login(process.env.TOKEN);
