module.exports = {
    name: 'guildCreate',
    once: false,

    async execute(guild, client) {
        console.log('\n\x1b[32m╔═══════════════════════════════════════════════════════════════╗');
        console.log(`║   🎉 JOINED NEW GUILD                                         ║`);
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║ 🏰 Guild Name:   ${guild.name.padEnd(35)} ║`);
        console.log(`║ 🆔 Guild ID:     ${guild.id.padEnd(35)} ║`);
        console.log(`║ 👥 Members:      ${guild.memberCount.toString().padEnd(35)} ║`);
        console.log('╚═══════════════════════════════════════════════════════════════╝\x1b[0m\n');

        // Create guild entry in database
        if (client.db) {
            client.db.createGuild(guild.id);
        }

        // Log analytics
        if (client.analytics) {
            client.analytics.db.logAnalytics('guild_join', {
                guildId: guild.id,
                guildName: guild.name,
                memberCount: guild.memberCount
            });
        }

        // Try to send welcome message to first available text channel
        try {
            const channel = guild.channels.cache.find(
                ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages')
            );

            if (channel) {
                const embed = client.ui.createSuccessEmbed(
                    '🎹 AXML Studio Pro is Here!',
                    'Thanks for adding me to your server!',
                    [
                        {
                            name: '🚀 Getting Started',
                            value: 'Type `~help` to see all commands',
                            inline: false
                        },
                        {
                            name: '🤖 AI Generation',
                            value: 'Create music with `~gen [your prompt]`',
                            inline: false
                        },
                        {
                            name: '📚 Templates',
                            value: 'Try pre-made tracks with `~template`',
                            inline: false
                        },
                        {
                            name: '🔗 Resources',
                            value: '[Documentation](https://luaapy.github.io/axml/) | [GitHub](https://github.com/luaapy/axml)',
                            inline: false
                        }
                    ]
                );

                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Failed to send welcome message:', error.message);
        }

        // Update bot presence
        client.user.setPresence({
            activities: [{
                name: `~help | ${client.guilds.cache.size} servers`,
                type: 0
            }]
        });
    }
};
