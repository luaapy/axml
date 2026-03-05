module.exports = {
    name: 'export',
    aliases: ['download', 'save'],
    description: 'Export current session in various formats',
    category: 'tools',
    usage: '~export [format]',
    examples: ['~export wav', '~export mp3', '~export midi', '~export xml', '~export all'],

    async execute(message, args, client) {
        const format = args[0]?.toLowerCase() || 'wav';
        const validFormats = ['wav', 'mp3', 'midi', 'xml', 'png', 'all'];

        if (!validFormats.includes(format)) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_009',
                'Invalid export format',
                [`Valid formats: ${validFormats.join(', ')}`, `You provided: ${format}`]
            );
            return message.reply({ embeds: [embed] });
        }

        const userSessions = client.sessions.getUserSessions(message.author.id);

        if (userSessions.length === 0) {
            const embed = client.ui.createErrorEmbed(
                'ERR_SESSION_001',
                'No active session found',
                ['Generate music with ~gen first', 'Or render an AXML file with ~render']
            );
            return message.reply({ embeds: [embed] });
        }

        const processingEmbed = client.ui.createProcessingEmbed(`Exporting to ${format.toUpperCase()}...`, 50);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            const latestSession = userSessions[userSessions.length - 1];
            const { AttachmentBuilder } = require('discord.js');
            const attachments = [];
            const exportedFormats = [];

            switch (format) {
                case 'wav':
                    attachments.push(new AttachmentBuilder(latestSession.audioPath, {
                        name: `${sanitizeFilename(latestSession.parsed.metadata.title)}.wav`
                    }));
                    exportedFormats.push('WAV (48kHz/24-bit)');
                    break;

                case 'mp3':
                    await processingMsg.edit({
                        embeds: [client.ui.createProcessingEmbed('Converting to MP3...', 75)]
                    });

                    const mp3Buffer = await convertWavToMp3(latestSession.audioPath);

                    if (mp3Buffer) {
                        const fs = require('fs');
                        const path = require('path');
                        const mp3Path = path.join(client.config.paths?.temp || './temp', `temp_${Date.now()}.mp3`);
                        fs.writeFileSync(mp3Path, mp3Buffer);

                        attachments.push(new AttachmentBuilder(mp3Path, {
                            name: `${sanitizeFilename(latestSession.parsed.metadata.title)}.mp3`
                        }));
                        exportedFormats.push('MP3 (320kbps)');
                    } else {
                        exportedFormats.push('MP3 (conversion in development - use WAV)');
                    }
                    break;

                case 'midi':
                    exportedFormats.push('MIDI (in development)');
                    break;

                case 'xml':
                    attachments.push(new AttachmentBuilder(latestSession.xmlPath, {
                        name: `${sanitizeFilename(latestSession.parsed.metadata.title)}.axml`
                    }));
                    exportedFormats.push('AXML 1.0');
                    break;

                case 'png':
                    attachments.push(new AttachmentBuilder(latestSession.imagePath, {
                        name: `${sanitizeFilename(latestSession.parsed.metadata.title)}_visualization.png`
                    }));
                    exportedFormats.push('PNG Visualization (Canvas Render)');
                    break;

                case 'all':
                    attachments.push(
                        new AttachmentBuilder(latestSession.audioPath, {
                            name: `${sanitizeFilename(latestSession.parsed.metadata.title)}.wav`
                        }),
                        new AttachmentBuilder(latestSession.xmlPath, {
                            name: `${sanitizeFilename(latestSession.parsed.metadata.title)}.axml`
                        }),
                        new AttachmentBuilder(latestSession.imagePath, {
                            name: `${sanitizeFilename(latestSession.parsed.metadata.title)}_visualization.png`
                        })
                    );
                    exportedFormats.push('WAV + AXML + PNG');
                    break;
            }

            const embed = client.ui.createSuccessEmbed(
                `Export Complete - ${format.toUpperCase()}`,
                `**Track:** ${latestSession.parsed.metadata.title}\n**Artist:** ${latestSession.parsed.metadata.artist}`,
                [
                    { name: 'Format(s)', value: exportedFormats.join('\n'), inline: false },
                    { name: 'Files', value: attachments.length.toString(), inline: true },
                    { name: 'Session', value: latestSession.sessionId || 'N/A', inline: true }
                ],
                'export_icon.svg'
            );

            // Add the icon to attachments if not already there
            attachments.push(new AttachmentBuilder(await client.svg.getIconPng('export_icon.svg'), { name: 'export_icon.png' }));

            await processingMsg.edit({
                content: `💾 **Export Complete**`,
                embeds: [embed],
                files: attachments.length > 0 ? attachments : []
            });

        } catch (error) {
            console.error('Export Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_EXPORT_001',
                `Export failed: ${error.message}`,
                ['Try a different format', 'Check if session files exist']
            );
            await processingMsg.edit({ embeds: [embed] });
        }
    }
};

function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9_\-]/gi, '_').substring(0, 100);
}

async function convertWavToMp3(wavPath) {
    return null;
}
