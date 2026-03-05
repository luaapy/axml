const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'analyze',
    aliases: ['check', 'validate', 'scan'],
    description: 'Analyze AXML file structure and statistics',
    category: 'tools',
    usage: 'analyze [attach .axml file] or use existing session',

    async execute(message, args, client) {
        let axmlContent = null;
        let source = 'Unknown';

        // 1. Check for Attachments
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (!attachment.name.endsWith('.axml') && !attachment.name.endsWith('.xml')) {
                return message.reply({
                    embeds: [client.ui.createErrorEmbed('ERR_INPUT_001', 'Invalid file type', ['Please attach a .axml file'])]
                });
            }

            try {
                const response = await axios.get(attachment.url);
                axmlContent = response.data;
                source = `File: ${attachment.name}`;
            } catch (error) {
                return message.reply({
                    embeds: [client.ui.createErrorEmbed('ERR_NET_001', 'Failed to download attachment', [error.message])]
                });
            }
        }
        // 2. Check for Active Session
        else {
            const sessions = client.sessions.getUserSessions(message.author.id);
            if (sessions.length > 0) {
                const latest = sessions[sessions.length - 1];
                axmlContent = latest.axml;
                source = `Session: ${latest.parsed.metadata.title}`;
            } else {
                return message.reply({
                    embeds: [client.ui.createErrorEmbed(
                        'ERR_INPUT_002',
                        'No AXML source found',
                        ['Attach an .axml file to analyze', 'Or generate music first with ~gen']
                    )]
                });
            }
        }

        if (!axmlContent) {
            return message.reply({ embeds: [client.ui.createErrorEmbed('ERR_SYS_001', 'Failed to retrieve AXML content')] });
        }

        // 3. Perform Analysis
        const processingEmbed = client.ui.createProcessingEmbed('Analyzing musical structure...', 0);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            await processingMsg.edit({ embeds: [client.ui.createProcessingEmbed('Parsing AXML data...', 50)] });
            const result = await client.axml.parse(axmlContent);

            if (!result.success) {
                const embed = client.ui.createErrorEmbed('ERR_XML_001', 'AXML validation failed', result.errors.map(e => e.message));
                return processingMsg.edit({ content: '', embeds: [embed] });
            }

            const data = result.data;
            const meta = data.metadata;

            // Calculate stats
            const trackCount = data.tracks.length;
            const noteCount = data.tracks.reduce((acc, t) => acc + (t.notes ? t.notes.length : 0), 0);
            const instrumentCount = data.instruments.length;
            const duration = meta.duration || 'Auto-calculated';

            const embed = new EmbedBuilder()
                .setColor(result.success ? 0x10b981 : 0xf59e0b)
                .setTitle(`📊 AXML Analysis Report`)
                .setDescription(`**Source:** ${source}\n**Status:** ${result.success ? '✅ Valid AXML' : '⚠️ Issues Found'}`)
                .addFields(
                    { name: '📋 Metadata', value: `**Title:** ${meta.title}\n**Artist:** ${meta.artist}\n**Tempo:** ${meta.tempo} BPM\n**Key:** ${meta.key}\n**Time Sig:** ${meta.timeSignature}`, inline: true },
                    { name: '🎼 Composition', value: `**Tracks:** ${trackCount}\n**Instruments:** ${instrumentCount}\n**Total Notes:** ${noteCount}`, inline: true },
                    { name: '⏱️ Duration', value: `${typeof duration === 'number' ? duration.toFixed(2) + 's' : duration}`, inline: true }
                )
                .setFooter({ text: `AXML Version ${data.version || '1.0'} | Studio Pro` })
                .setTimestamp();

            // Add warnings/errors if any
            if (result.errors && result.errors.length > 0) {
                embed.addFields({
                    name: '❌ Errors',
                    value: result.errors.map(e => `• ${e.message}`).join('\n').slice(0, 1024)
                });
            }

            if (result.warnings && result.warnings.length > 0) {
                embed.addFields({
                    name: '⚠️ Warnings',
                    value: result.warnings.map(w => `• ${w}`).join('\n').slice(0, 1024)
                });
            }

            // Instrument breakdown
            if (instrumentCount > 0) {
                const instList = data.instruments.map(i => `\`${i.id}\` (${i.type})`).join(', ');
                embed.addFields({ name: '🎹 Instruments', value: instList.length > 1024 ? instList.substring(0, 1021) + '...' : instList });
            }

            await processingMsg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error('Analysis failed:', error);
            await processingMsg.edit({
                content: '',
                embeds: [client.ui.createErrorEmbed('ERR_P_001', 'Analysis crashed', [error.message])]
            });
        }
    }
};
