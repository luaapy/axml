module.exports = {
    name: 'template',
    aliases: ['templates', 'preset', 'presets'],
    description: 'Browse and load AXML templates',
    category: 'tools',
    usage: '~template [name]',
    examples: ['~template', '~template synthwave', '~template lofi'],

    async execute(message, args, client) {
        const fs = require('fs');
        const path = require('path');

        const templatesDir = path.join(__dirname, '../../assets/templates');

        if (!fs.existsSync(templatesDir)) {
            const embed = client.ui.createErrorEmbed(
                'ERR_IO_007',
                'Templates directory not found',
                ['Templates have not been set up yet']
            );
            return message.reply({ embeds: [embed] });
        }

        const templates = fs.readdirSync(templatesDir)
            .filter(f => f.endsWith('.axml'))
            .map(f => f.replace('.axml', ''));

        if (!args.length) {
            const templateList = templates.map((t, i) => `${i + 1}. **${t}**`).join('\n');

            const embed = client.ui.createSuccessEmbed(
                '📚 Available Templates',
                templateList || 'No templates available',
                [
                    { name: 'Usage', value: '~template [name]', inline: false },
                    { name: 'Example', value: '~template synthwave', inline: false }
                ]
            );

            return message.reply({ embeds: [embed] });
        }

        const templateName = args.join('-').toLowerCase();
        const templatePath = path.join(templatesDir, `${templateName}.axml`);

        if (!fs.existsSync(templatePath)) {
            const embed = client.ui.createErrorEmbed(
                'ERR_IO_008',
                'Template not found',
                [`Available templates: ${templates.join(', ')}`, `You requested: ${templateName}`]
            );
            return message.reply({ embeds: [embed] });
        }

        const processingEmbed = client.ui.createProcessingEmbed('Loading template...', 25);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            const axmlContent = fs.readFileSync(templatePath, 'utf-8');

            await processingMsg.edit({
                embeds: [client.ui.createProcessingEmbed('Parsing AXML...', 50)]
            });

            const parseResult = await client.axml.parse(axmlContent);

            if (!parseResult.success) {
                const embed = client.ui.createErrorEmbed(
                    'ERR_XML_001',
                    'Template validation failed',
                    parseResult.errors.map(e => e.message)
                );
                return processingMsg.edit({ embeds: [embed] });
            }

            await processingMsg.edit({
                embeds: [client.ui.createProcessingEmbed('Synthesizing audio...', 75)]
            });

            const audioResult = await client.audio.synthesize(parseResult.data);

            if (!audioResult.success) {
                const embed = client.ui.createErrorEmbed(
                    'ERR_AUDIO_001',
                    'Audio synthesis failed',
                    [audioResult.error]
                );
                return processingMsg.edit({ embeds: [embed] });
            }

            const { AttachmentBuilder } = require('discord.js');
            const timestamp = Date.now();

            const wavFilename = `template_${templateName}_${timestamp}.wav`;
            const pngFilename = `template_${templateName}_${timestamp}.png`;

            const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);

            const svgContent = client.svg.generatePianoRoll(parseResult.data);
            const pngBuffer = await client.svg.svgToPng(svgContent);
            const pngPath = path.join(client.config.paths?.temp || './temp', pngFilename);
            fs.writeFileSync(pngPath, pngBuffer);

            const sessionId = client.sessions.createSession(message.author.id, {
                axml: axmlContent,
                parsed: parseResult.data,
                audioPath: wavPath,
                imagePath: pngPath,
                xmlPath: templatePath,
                source: 'template',
                templateName: templateName
            });

            const embed = client.ui.createRenderCompleteEmbed(
                parseResult.data.metadata,
                audioResult.duration,
                pngFilename
            );

            embed.addFields({ name: '📚 Template', value: templateName, inline: true });

            const attachments = [
                new AttachmentBuilder(pngPath, { name: pngFilename }),
                new AttachmentBuilder(wavPath, { name: wavFilename }),
                new AttachmentBuilder(await client.svg.getIconPng('logo.svg'), { name: 'logo.png' }),
                new AttachmentBuilder(await client.svg.getIconPng('play_icon.svg'), { name: 'play_icon.png' })
            ];

            const components = [
                client.ui.createTransportControls(),
                client.ui.createFileOperations()
            ];

            await processingMsg.edit({
                content: `### ✅ **Template Loaded: ${templateName}**`,
                embeds: [embed],
                files: attachments,
                components: components
            });

        } catch (error) {
            console.error('Template Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_SYS_005',
                `Template loading failed: ${error.message}`,
                ['Try a different template', 'Check template file integrity']
            );
            await processingMsg.edit({ embeds: [embed] });
        }
    }
};
