module.exports = {
    name: 'tempo',
    aliases: ['bpm', 'speed'],
    description: 'Change the tempo/BPM of the current session',
    category: 'effects',
    usage: '~tempo [BPM]',
    examples: ['~tempo 140', '~tempo 90', '~tempo 180'],

    async execute(message, args, client) {
        if (!args.length) {
            const userSessions = client.sessions.getUserSessions(message.author.id);

            if (userSessions.length === 0) {
                const embed = client.ui.createErrorEmbed(
                    'ERR_SESSION_001',
                    'No active session found',
                    ['Generate music with ~gen first', 'Or render an AXML file with ~render']
                );
                return message.reply({ embeds: [embed] });
            }

            const currentTempo = userSessions[userSessions.length - 1].parsed.metadata?.tempo || 120;
            const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

            const embed = new EmbedBuilder()
                .setColor(0x00FBFF)
                .setTitle('⏱️ **Tempo Adjustment**')
                .setDescription(`Current Tempo: **${currentTempo} BPM**\nSelect a new tempo setting:`)
                .setFooter({ text: 'AXML Studio Pro' });

            const options = [
                { label: 'Half Time (0.5x)', value: Math.round(currentTempo * 0.5).toString(), description: `${Math.round(currentTempo * 0.5)} BPM`, emoji: '🐢' },
                { label: '-10 BPM', value: (currentTempo - 10).toString(), description: `${currentTempo - 10} BPM`, emoji: '➖' },
                { label: '+10 BPM', value: (currentTempo + 10).toString(), description: `${currentTempo + 10} BPM`, emoji: '➕' },
                { label: 'Double Time (2.0x)', value: Math.round(currentTempo * 2).toString(), description: `${Math.round(currentTempo * 2)} BPM`, emoji: '🐇' },
                { label: 'Lo-Fi (85 BPM)', value: '85', description: 'Chill beats', emoji: '☕' },
                { label: 'Pop / HipHop (100 BPM)', value: '100', description: 'Standard groove', emoji: '🎤' },
                { label: 'House (128 BPM)', value: '128', description: 'Dance floor', emoji: '💃' },
                { label: 'Dubstep (140 BPM)', value: '140', description: 'Bass heavy', emoji: '🔊' },
                { label: 'DnB (174 BPM)', value: '174', description: 'Fast pace', emoji: '🏃' }
            ];

            const menu = new StringSelectMenuBuilder()
                .setCustomId('tempo_select')
                .setPlaceholder(`Change from ${currentTempo} BPM...`)
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(menu);

            return message.reply({
                embeds: [embed],
                components: [row]
            });
        }

        const newTempo = parseInt(args[0]);

        if (isNaN(newTempo) || newTempo < 30 || newTempo > 300) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_008',
                'Invalid tempo value',
                ['Must be between 30 and 300 BPM', `You provided: ${args[0]}`]
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

        const processingEmbed = client.ui.createProcessingEmbed('Changing tempo...', 50);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            const latestSession = userSessions[userSessions.length - 1];
            const oldTempo = latestSession.parsed.metadata.tempo;

            const modifiedData = JSON.parse(JSON.stringify(latestSession.parsed));
            modifiedData.metadata.tempo = newTempo;

            await processingMsg.edit({
                embeds: [client.ui.createProcessingEmbed('Re-synthesizing audio...', 75)]
            });

            const audioResult = await client.audio.synthesize(modifiedData);

            if (!audioResult.success) {
                const embed = client.ui.createErrorEmbed(
                    'ERR_AUDIO_001',
                    'Audio synthesis failed',
                    [audioResult.error]
                );
                return processingMsg.edit({ embeds: [embed] });
            }

            const fs = require('fs');
            const path = require('path');
            const { AttachmentBuilder } = require('discord.js');
            const timestamp = Date.now();

            const wavFilename = `tempo_${message.author.id}_${timestamp}.wav`;
            const pngFilename = `tempo_${message.author.id}_${timestamp}.png`;
            const xmlFilename = `tempo_${message.author.id}_${timestamp}.axml`;

            const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);

            const svgContent = client.svg.generatePianoRoll(modifiedData);
            const pngBuffer = await client.svg.svgToPng(svgContent);
            const pngPath = path.join(client.config.paths?.temp || './temp', pngFilename);
            fs.writeFileSync(pngPath, pngBuffer);

            const xmlContent = await client.exporter.toAxml(modifiedData);
            const xmlPath = path.join(client.config.paths?.temp || './temp', xmlFilename);
            fs.writeFileSync(xmlPath, xmlContent);

            const sessionId = client.sessions.createSession(message.author.id, {
                axml: xmlContent,
                parsed: modifiedData,
                audioPath: wavPath,
                imagePath: pngPath,
                xmlPath: xmlPath
            });

            const percentChange = ((newTempo - oldTempo) / oldTempo * 100).toFixed(1);

            const embed = client.ui.createSuccessEmbed(
                'Tempo Changed',
                `**Track:** ${modifiedData.metadata.title}\n**Original:** ${oldTempo} BPM\n**New:** ${newTempo} BPM\n**Change:** ${percentChange > 0 ? '+' : ''}${percentChange}%`,
                [
                    { name: 'New BPM', value: newTempo.toString(), inline: true },
                    { name: 'Key', value: modifiedData.metadata.key, inline: true },
                    { name: 'New Duration', value: client.ui.formatDuration(audioResult.duration), inline: true }
                ]
            );

            embed.setImage(`attachment://${pngFilename}`);

            const attachments = [
                new AttachmentBuilder(pngPath, { name: pngFilename }),
                new AttachmentBuilder(wavPath, { name: wavFilename })
            ];

            const components = [
                client.ui.createTransportControls(),
                client.ui.createFileOperations()
            ];

            const iconAttachments = await client.ui.getCommonIconAttachments(client, ['play_icon.svg', 'logo.svg']);
            attachments.push(...iconAttachments);

            await processingMsg.edit({
                content: `### ✅ **Tempo Adjusted: ${newTempo} BPM**`,
                embeds: [embed],
                files: attachments,
                components: components
            });

        } catch (error) {
            console.error('Tempo Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_SYS_004',
                `Tempo change failed: ${error.message}`,
                ['Try a different tempo value', 'Check your session is valid']
            );
            await processingMsg.edit({ embeds: [embed] });
        }
    },
    async handleInteraction(interaction, client, value) {
        const newTempo = parseInt(value);
        const userSessions = client.sessions.getUserSessions(interaction.user.id);

        if (userSessions.length === 0) {
            return interaction.update({
                content: '❌ No active session found.',
                embeds: [],
                components: []
            });
        }

        const processingEmbed = client.ui.createProcessingEmbed('Changing tempo...', 50);
        await interaction.update({ embeds: [processingEmbed], components: [] });

        const editMsg = async (opts) => interaction.editReply(opts);

        try {
            const latestSession = userSessions[userSessions.length - 1];
            const oldTempo = latestSession.parsed.metadata.tempo;

            const modifiedData = JSON.parse(JSON.stringify(latestSession.parsed));
            modifiedData.metadata.tempo = newTempo;

            await editMsg({
                embeds: [client.ui.createProcessingEmbed('Re-synthesizing audio...', 75)]
            });

            const audioResult = await client.audio.synthesize(modifiedData);

            if (!audioResult.success) {
                const embed = client.ui.createErrorEmbed(
                    'ERR_AUDIO_001',
                    'Audio synthesis failed',
                    [audioResult.error]
                );
                return editMsg({ embeds: [embed] });
            }

            const fs = require('fs');
            const path = require('path');
            const { AttachmentBuilder } = require('discord.js');
            const timestamp = Date.now();

            const wavFilename = `tempo_${interaction.user.id}_${timestamp}.wav`;
            const pngFilename = `tempo_${interaction.user.id}_${timestamp}.png`;
            const xmlFilename = `tempo_${interaction.user.id}_${timestamp}.axml`;

            const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);

            const svgContent = client.svg.generatePianoRoll(modifiedData);
            const pngBuffer = await client.svg.svgToPng(svgContent);
            const pngPath = path.join(client.config.paths?.temp || './temp', pngFilename);
            fs.writeFileSync(pngPath, pngBuffer);

            const xmlContent = await client.exporter.toAxml(modifiedData);
            const xmlPath = path.join(client.config.paths?.temp || './temp', xmlFilename);
            fs.writeFileSync(xmlPath, xmlContent);

            const sessionId = client.sessions.createSession(interaction.user.id, {
                axml: xmlContent,
                parsed: modifiedData,
                audioPath: wavPath,
                imagePath: pngPath,
                xmlPath: xmlPath
            });

            const percentChange = ((newTempo - oldTempo) / oldTempo * 100).toFixed(1);

            const embed = client.ui.createSuccessEmbed(
                'Tempo Changed',
                `**Track:** ${modifiedData.metadata.title}\n**Original:** ${oldTempo} BPM\n**New:** ${newTempo} BPM\n**Change:** ${percentChange > 0 ? '+' : ''}${percentChange}%`,
                [
                    { name: 'New BPM', value: newTempo.toString(), inline: true },
                    { name: 'Key', value: modifiedData.metadata.key, inline: true },
                    { name: 'New Duration', value: client.ui.formatDuration(audioResult.duration), inline: true }
                ]
            );

            embed.setImage(`attachment://${pngFilename}`);

            const attachments = [
                new AttachmentBuilder(pngPath, { name: pngFilename }),
                new AttachmentBuilder(wavPath, { name: wavFilename })
            ];

            const components = [
                client.ui.createTransportControls(),
                client.ui.createFileOperations()
            ];

            const iconAttachments = await client.ui.getCommonIconAttachments(client, ['play_icon.svg', 'logo.svg']);
            attachments.push(...iconAttachments);

            await editMsg({
                content: `### ✅ **Tempo Adjusted: ${newTempo} BPM**`,
                embeds: [embed],
                files: attachments,
                components: components
            });

        } catch (error) {
            console.error('Tempo Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_SYS_004',
                `Tempo change failed: ${error.message}`,
                ['Try a different tempo value', 'Check your session is valid']
            );
            await editMsg({ embeds: [embed] });
        }
    }
};
