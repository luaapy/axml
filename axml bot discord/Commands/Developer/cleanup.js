module.exports = {
    name: 'cleanup',
    aliases: ['clean', 'purge'],
    description: 'Clean up temporary files and old sessions (Admin only)',
    category: 'admin',
    usage: 'cleanup [age_hours]',
    examples: ['~cleanup', '~cleanup 2'],

    async execute(message, args, client) {
        // Check if user is bot owner
        const owners = Array.isArray(client.config.bot.owners) ?
            client.config.bot.owners : [client.config.bot.owners];

        if (!owners.includes(message.author.id)) {
            const embed = client.ui.createErrorEmbed(
                'ERR_PERM_001',
                'Permission denied',
                ['This command is restricted to bot owners']
            );
            return message.reply({ embeds: [embed] });
        }

        const ageHours = parseInt(args[0]) || 1;
        const maxAgeMs = ageHours * 60 * 60 * 1000;

        const processingEmbed = client.ui.createProcessingEmbed('Starting cleanup...', 25);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            const fs = require('fs');
            const path = require('path');

            await processingMsg.edit({
                embeds: [client.ui.createProcessingEmbed('Cleaning temporary files...', 50)]
            });

            // Clean temp files
            const tempDir = path.join(__dirname, '../../temp');
            let filesDeleted = 0;
            let bytesFreed = 0;

            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                const now = Date.now();

                files.forEach(file => {
                    const filePath = path.join(tempDir, file);
                    const stats = fs.statSync(filePath);

                    if (now - stats.mtimeMs > maxAgeMs) {
                        bytesFreed += stats.size;
                        fs.unlinkSync(filePath);
                        filesDeleted++;
                    }
                });
            }

            await processingMsg.edit({
                embeds: [client.ui.createProcessingEmbed('Cleaning old sessions...', 75)]
            });

            // Clean old sessions
            const allSessions = Array.from(client.sessions.activeSessions.values());
            let sessionsDeleted = 0;
            const now = Date.now();

            allSessions.forEach(session => {
                if (now - session.createdAt > maxAgeMs) {
                    client.sessions.endSession(session.sessionId);
                    sessionsDeleted++;
                }
            });

            const embed = client.ui.createSuccessEmbed(
                'Cleanup Complete',
                `Removed files and sessions older than ${ageHours} hour(s)`,
                [
                    { name: 'Files Deleted', value: filesDeleted.toString(), inline: true },
                    { name: 'Space Freed', value: formatBytes(bytesFreed), inline: true },
                    { name: 'Sessions Cleared', value: sessionsDeleted.toString(), inline: true }
                ]
            );

            await processingMsg.edit({ embeds: [embed] });

            console.log(`🧹 Cleanup: ${filesDeleted} files (${formatBytes(bytesFreed)}), ${sessionsDeleted} sessions`);

        } catch (error) {
            console.error('Cleanup Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_SYS_006',
                `Cleanup failed: ${error.message}`,
                ['Check bot permissions', 'Check file system access']
            );
            await processingMsg.edit({ embeds: [embed] });
        }
    }
};

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
