module.exports = {
    name: 'stats',
    aliases: ['status', 'info', 'about'],
    description: 'Display bot statistics and system information',
    category: 'tools',
    usage: '~stats',
    examples: ['~stats'],

    async execute(message, args, client) {
        const mem = process.memoryUsage();
        const uptime = process.uptime();

        const stats = {
            activeSessions: client.sessions.activeSessions.size,
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            memoryMB: Math.round(mem.heapUsed / 1024 / 1024),
            uptime: formatUptime(uptime),
            commands: client.commands.size
        };

        const { AttachmentBuilder } = require('discord.js');
        const path = require('path');
        const embed = client.ui.createStatsEmbed(stats);
        const attachments = await client.ui.getCommonIconAttachments(client, ['logo.svg']);

        await message.reply({
            embeds: [embed],
            files: attachments
        });
    }
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}
