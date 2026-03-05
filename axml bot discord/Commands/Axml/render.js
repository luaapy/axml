const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: 'render',
    aliases: ['parse', 'compile', 'load'],
    description: 'Parse and render uploaded AXML files',
    category: 'axml',
    usage: 'render [attach .axml file]',
    examples: ['render (with attached .axml file)'],

    async execute(message, args, client) {
        const attachment = message.attachments.first();

        if (!attachment) {
            const projects = client.db.getUserProjects(message.author.id);
            const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

            const embed = new EmbedBuilder()
                .setColor(0x00FBFF)
                .setTitle('🎹 **Render AXML**')
                .setDescription(projects.length > 0
                    ? 'Upload an `.axml` file or select a saved project below.'
                    : '⚠️ **No saved projects found.**\nPlease attach an `.axml` file to render or save a project first.')
                .setFooter({ text: 'AXML Studio Pro' });

            const options = projects.map(p => ({
                label: p.name,
                description: `Tracks: ${p.metadata?.tracks?.length || '?'}`,
                value: p.name,
                emoji: '🎵'
            })).slice(0, 24);

            options.push({
                label: 'Cancel',
                value: 'cancel_render',
                emoji: '❌',
                description: 'Dismiss this message'
            });

            const menu = new StringSelectMenuBuilder()
                .setCustomId('render_project_select')
                .setPlaceholder(projects.length > 0 ? 'Select a project...' : 'No projects available')
                .addOptions(options);

            if (projects.length === 0) {
                // If no projects, we can still show the menu with just Cancel, or disable it
                // But user wants "select menu", so let's keep it interactive for Cancel
            }

            const row = new ActionRowBuilder().addComponents(menu);

            return message.reply({ embeds: [embed], components: [row] });
        }

        if (!attachment.name.endsWith('.axml') && !attachment.name.endsWith('.xml')) {
            const embed = client.ui.createErrorEmbed('ERR_INPUT_003', 'Invalid file format', ['File must be .axml']);
            return message.reply({ embeds: [embed] });
        }

        const processingEmbed = client.ui.createProcessingEmbed('Initializing...', 0);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            await processingMsg.edit({ embeds: [client.ui.createProcessingEmbed('Downloading file...', 20)] });
            const response = await axios.get(attachment.url);
            const axmlContent = response.data;

            await processingMsg.edit({ embeds: [client.ui.createProcessingEmbed('Parsing AXML...', 50)] });
            const parseResult = await client.axml.parse(axmlContent);

            if (!parseResult.success) {
                const embed = client.ui.createErrorEmbed('ERR_XML_001', 'AXML validation failed', parseResult.errors.map(e => e.message));
                return processingMsg.edit({ embeds: [embed] });
            }

            await processingMsg.edit({ embeds: [client.ui.createProcessingEmbed('Synthesizing audio...', 80)] });
            const audioResult = await client.audio.synthesize(parseResult.data);

            if (!audioResult.success) {
                const embed = client.ui.createErrorEmbed('ERR_AUDIO_001', 'Audio synthesis failed', [audioResult.error]);
                return processingMsg.edit({ embeds: [embed] });
            }

            const timestamp = Date.now();
            const wavFilename = `render_${message.author.id}_${timestamp}.wav`;
            const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);

            const renderEmbed = client.ui.createRenderCompleteEmbed(parseResult.data.metadata, audioResult.duration);

            await processingMsg.edit({
                content: `### ✅ **Render Complete!**`,
                embeds: [renderEmbed],
                files: [new AttachmentBuilder(wavPath, { name: wavFilename })],
                components: [client.ui.createTransportControls()]
            });

        } catch (error) {
            console.error('Render Error:', error);
            const embed = client.ui.createErrorEmbed('ERR_SYS_002', `Render failed: ${error.message}`, ['Contact developers']);
            await processingMsg.edit({ embeds: [embed] });
        }
    }
};
