module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'rankings', 'lb'],
    description: 'View top users by various metrics',
    category: 'tools',
    usage: '~leaderboard [metric]',
    examples: ['~leaderboard', '~leaderboard generations', '~leaderboard playtime'],

    async execute(message, args, client) {
        if (!client.db) {
            const embed = client.ui.createErrorEmbed(
                'ERR_DB_001',
                'Database not available',
                []
            );
            return message.reply({ embeds: [embed] });
        }

        const metric = args[0]?.toLowerCase() || 'generations';
        const validMetrics = ['generations', 'renders', 'exports', 'playtime'];

        if (!validMetrics.includes(metric)) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_011',
                'Invalid metric',
                [`Valid metrics: ${validMetrics.join(', ')}`]
            );
            return message.reply({ embeds: [embed] });
        }

        try {
            const users = client.db.collections.get('users');
            const usersArray = Array.from(users.values());

            // Map metric to stat field
            const statMap = {
                'generations': 'generationsTotal',
                'renders': 'rendersTotal',
                'exports': 'exportsTotal',
                'playtime': 'playtimeSeconds'
            };

            const statField = statMap[metric];

            // Sort users by the metric
            usersArray.sort((a, b) => (b.stats[statField] || 0) - (a.stats[statField] || 0));

            const top10 = usersArray.slice(0, 10);

            // Build leaderboard text
            const leaderboardText = await Promise.all(top10.map(async (user, index) => {
                try {
                    const discordUser = await client.users.fetch(user.id).catch(() => null);
                    const username = discordUser ? discordUser.username : `User ${user.id.substring(0, 8)}`;
                    const value = user.stats[statField] || 0;
                    const formattedValue = metric === 'playtime' ?
                        `${Math.floor(value / 60)}m` : value.toString();

                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▪️';
                    return `${medal} **${index + 1}.** ${username} - **${formattedValue}**`;
                } catch (error) {
                    return `▪️ **${index + 1}.** Unknown User`;
                }
            }));

            const metricNames = {
                'generations': 'AI Generations',
                'renders': 'File Renders',
                'exports': 'Exports',
                'playtime': 'Playtime'
            };

            const embed = client.ui.createSuccessEmbed(
                `🏆 Leaderboard - ${metricNames[metric]}`,
                leaderboardText.join('\n'),
                [
                    { name: 'Total Users', value: usersArray.length.toString(), inline: true },
                    { name: 'Metric', value: metricNames[metric], inline: true }
                ]
            );

            const attachments = await client.ui.getCommonIconAttachments(client, ['logo.svg']);

            await message.reply({ embeds: [embed], files: attachments });

        } catch (error) {
            console.error('Leaderboard Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_DB_003',
                `Failed to load leaderboard: ${error.message}`,
                []
            );
            await message.reply({ embeds: [embed] });
        }
    }
};
