module.exports = {
    name: 'profile',
    aliases: ['me', 'stats-user', 'userinfo'],
    description: 'View your user profile and statistics',
    category: 'tools',
    usage: '~profile [@user]',
    examples: ['~profile', '~profile @username'],

    async execute(message, args, client) {
        const targetUser = message.mentions.users.first() || message.author;

        if (!client.db) {
            const embed = client.ui.createErrorEmbed(
                'ERR_DB_001',
                'Database not available',
                ['Database system is not initialized']
            );
            return message.reply({ embeds: [embed] });
        }

        try {
            const user = client.db.getUser(targetUser.id);
            const projects = client.db.getUserProjects(targetUser.id);
            const activity = client.analytics?.getUserActivity(targetUser.id) || { totalEvents: 0, byType: {} };

            const { AttachmentBuilder } = require('discord.js');
            const path = require('path');
            const embed = client.ui.createProfileEmbed(user, targetUser, projects, activity);
            const attachments = await client.ui.getCommonIconAttachments(client, ['settings_icon.svg']);

            await message.reply({
                embeds: [embed],
                files: attachments
            });

        } catch (error) {
            console.error('Profile Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_DB_002',
                `Failed to load profile: ${error.message}`,
                []
            );
            await message.reply({ embeds: [embed] });
        }
    }
};
