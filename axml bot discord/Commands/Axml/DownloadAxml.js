const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'downloadaxml',
    aliases: ['getaxml', 'raw', 'exportaxml'],
    description: 'Download the AXML source code of your current session',
    category: 'axml',
    usage: '~downloadaxml',
    examples: ['~downloadaxml'],

    async execute(message, args, client) {
        const userSessions = client.sessions.getUserSessions(message.author.id);

        if (userSessions.length === 0) {
            return message.reply('❌ **No active session!** Create something first with `~gen`.');
        }

        const latestSession = userSessions[userSessions.length - 1];
        const filename = `${latestSession.parsed.metadata.title.replace(/\s+/g, '_')}.axml`;
        const tempPath = path.join(client.config.paths?.temp || './temp', filename);

        try {
            // Re-generate XML string from parsed data if possible, 
            // but the session usually stores the raw AXML if it was uploaded or generated.
            // Let's assume session has 'axml' content.
            const axmlContent = latestSession.axml || latestSession.rawContent;

            if (!axmlContent) {
                return message.reply('❌ **Error:** Source AXML data not found for this session.');
            }

            fs.writeFileSync(tempPath, axmlContent);

            const attachment = new AttachmentBuilder(tempPath, { name: filename });
            await message.reply({
                content: `📄 **AXML Source:** \`${latestSession.parsed.metadata.title}\``,
                files: [attachment]
            });

            // Cleanup temp file after a delay
            setTimeout(() => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }, 60000);

        } catch (error) {
            console.error('Download Error:', error);
            message.reply(`❌ **Failed to export AXML:** ${error.message}`);
        }
    }
};
