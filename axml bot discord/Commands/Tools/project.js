const { ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'project',
    aliases: ['proj', 'save', 'load'],
    description: 'Manage your saved projects',
    category: 'tools',
    usage: '~project [save/load/list/delete] [name]',
    examples: ['~project save MyTrack', '~project load MyTrack', '~project list', '~project delete MyTrack'],

    async execute(message, args, client) {
        if (!client.db) {
            const embed = client.ui.createErrorEmbed(
                'ERR_DB_001',
                'Database not available',
                []
            );
            return message.reply({ embeds: [embed] });
        }

        const action = args[0]?.toLowerCase();

        if (!action) {
            const embed = new EmbedBuilder()
                .setColor(0x00FBFF)
                .setTitle('🎹 **Project Manager**')
                .setDescription('Select an action from the menu below to manage your projects.')
                .addFields(
                    { name: '💾 Save', value: 'Save current session', inline: true },
                    { name: '📂 Load', value: 'Load a saved project', inline: true },
                    { name: '📜 List', value: 'View saved projects', inline: true },
                    { name: '🗑️ Delete', value: 'Delete a project', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'AXML Studio Pro' });

            const menu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('project_menu')
                    .setPlaceholder('Select an action...')
                    .addOptions([
                        { label: 'List Projects', value: 'list', description: 'View all saved projects', emoji: '📜' },
                        { label: 'Load Project', value: 'load', description: 'Load and render a saved project', emoji: '📂' },
                        { label: 'Save Project', value: 'save', description: 'Save current session as a project', emoji: '💾' },
                        { label: 'Delete Project', value: 'delete', description: 'Permanently delete a project', emoji: '🗑️' }
                    ])
            );

            return message.reply({ embeds: [embed], components: [menu] });
        }

        if (!['save', 'load', 'list', 'delete'].includes(action)) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_012',
                'Invalid action',
                ['Valid actions: save, load, list, delete', 'Example: ~project save MyTrack']
            );
            return message.reply({ embeds: [embed] });
        }

        try {
            switch (action) {
                case 'save':
                    await this.handleSave(message, args, client);
                    break;
                case 'load':
                    await this.handleLoad(message, args, client);
                    break;
                case 'list':
                    await this.handleList(message, client);
                    break;
                case 'delete':
                    await this.handleDelete(message, args, client);
                    break;
            }
        } catch (error) {
            console.error('Project Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_PROJECT_001',
                `Project operation failed: ${error.message}`,
                []
            );
            await message.reply({ embeds: [embed] });
        }
    },

    async handleSave(context, args, client) {
        const userId = context.author ? context.author.id : context.user.id;
        // Check if args is string (project name from modal) or array (args from command)
        const projectName = Array.isArray(args) ? args.slice(1).join(' ') : args;

        const reply = (opts) => {
            if (context.replied || context.deferred) return context.editReply(opts);
            return context.reply(opts);
        };

        if (!projectName) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_013',
                'No project name provided',
                ['Example: ~project save MyTrack']
            );
            return reply({ embeds: [embed], ephemeral: true });
        }

        const userSessions = client.sessions.getUserSessions(userId);

        if (userSessions.length === 0) {
            const embed = client.ui.createErrorEmbed(
                'ERR_SESSION_001',
                'No active session to save',
                ['Generate or render music first']
            );
            return reply({ embeds: [embed], ephemeral: true });
        }

        const latestSession = userSessions[userSessions.length - 1];

        const project = client.db.saveProject(userId, {
            name: projectName,
            axml: latestSession.axml,
            metadata: latestSession.parsed?.metadata,
            tags: []
        });

        const embed = client.ui.createSuccessEmbed(
            'Project Saved',
            `**${projectName}** has been saved to your library`,
            [
                { name: 'Project ID', value: project.id, inline: true },
                { name: 'Tracks', value: latestSession.parsed?.tracks?.length.toString() || '0', inline: true }
            ]
        );

        await reply({
            embeds: [embed],
            files: client.ui.getCommonIcons(['logo.svg'])
        });
    },

    async handleLoad(context, args, client) {
        const userId = context.author ? context.author.id : context.user.id;
        const projectName = Array.isArray(args) ? args.slice(1).join(' ') : args;

        const reply = async (opts) => {
            if (context.deferred || context.replied) return context.editReply(opts);
            return context.reply(opts);
        };

        if (!projectName) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_014',
                'No project name provided',
                ['Example: ~project load MyTrack']
            );
            return reply({ embeds: [embed], ephemeral: true });
        }

        const projects = client.db.getUserProjects(userId);
        const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());

        if (!project) {
            const embed = client.ui.createErrorEmbed(
                'ERR_PROJECT_002',
                'Project not found',
                [`No project named "${projectName}"`, 'Use ~project list to see your projects']
            );
            return reply({ embeds: [embed], ephemeral: true });
        }

        const processingEmbed = client.ui.createProcessingEmbed('Loading project...', 50);

        let processingMsg;
        // For interactions, we prefer hidden/ephemeral unless it's a command
        const isInteraction = !context.author;

        if (isInteraction) {
            if (!context.deferred && !context.replied) await context.reply({ embeds: [processingEmbed], ephemeral: true });
            else await context.editReply({ embeds: [processingEmbed] });
            processingMsg = context;
        } else {
            processingMsg = await context.reply({
                embeds: [processingEmbed],
                files: client.ui.getCommonIcons(['settings_icon.svg', 'stop_icon.svg'])
            });
        }

        // Parse and render the project
        const parseResult = await client.axml.parse(project.axml);

        if (!parseResult.success) {
            const embed = client.ui.createErrorEmbed(
                'ERR_XML_001',
                'Failed to parse project',
                parseResult.errors.map(e => e.message)
            );
            if (processingMsg.edit && !isInteraction) return processingMsg.edit({ embeds: [embed] });
            return context.editReply({ embeds: [embed] });
        }

        const audioResult = await client.audio.synthesize(parseResult.data);

        if (!audioResult.success) {
            const embed = client.ui.createErrorEmbed(
                'ERR_AUDIO_001',
                'Failed to synthesize audio',
                [audioResult.error]
            );
            if (processingMsg.edit && !isInteraction) return processingMsg.edit({ embeds: [embed] });
            return context.editReply({ embeds: [embed] });
        }

        const timestamp = Date.now();
        const wavFilename = `project_${timestamp}.wav`;
        const pngFilename = `project_${timestamp}.png`;

        const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);
        const svgContent = client.svg.generatePianoRoll(parseResult.data);
        const pngBuffer = await client.svg.svgToPng(svgContent);

        const pngPath = path.join(client.config.paths?.temp || './temp', pngFilename);
        fs.writeFileSync(pngPath, pngBuffer);

        const sessionId = client.sessions.createSession(userId, {
            axml: project.axml,
            parsed: parseResult.data,
            audioPath: wavPath,
            imagePath: pngPath
        });

        const embed = client.ui.createSuccessEmbed(
            'Project Loaded',
            `**${project.name}**`,
            [
                { name: 'Tempo', value: `${parseResult.data.metadata.tempo} BPM`, inline: true },
                { name: 'Key', value: parseResult.data.metadata.key, inline: true },
                { name: 'Tracks', value: parseResult.data.tracks.length.toString(), inline: true }
            ]
        );

        embed.setImage(`attachment://${pngFilename}`);

        const attachments = [
            new AttachmentBuilder(pngPath, { name: pngFilename }),
            new AttachmentBuilder(wavPath, { name: wavFilename }),
            new AttachmentBuilder(await client.svg.getIconPng('play_icon.svg'), { name: 'play_icon.png' }),
            new AttachmentBuilder(await client.svg.getIconPng('logo.svg'), { name: 'logo.png' })
        ];

        const payload = {
            content: `### ✅ **Project Loaded: ${project.name}**`,
            embeds: [embed],
            files: attachments,
            components: [client.ui.createTransportControls(), client.ui.createFileOperations()]
        };

        if (processingMsg.edit && !isInteraction) await processingMsg.edit(payload);
        else await context.editReply(payload);
    },

    async handleList(context, client) {
        const userId = context.author ? context.author.id : context.user.id;
        const projects = client.db.getUserProjects(userId);

        const reply = async (opts) => {
            if (context.update) {
                // For menu interactions, we want to update the message but maybe keep the menu or replace it.
                // If we use update, it replaces the message components unless we resend them.
                // We'll replace the menu with no components or maybe a 'back' button in future.
                // For now, let's just use reply(ephemeral) for list if it's too long? 
                // Or update the embed.
                return context.update(opts);
            }
            return context.reply(opts);
        };

        if (projects.length === 0) {
            const embed = client.ui.createErrorEmbed(
                'ERR_PROJECT_003',
                'No saved projects',
                ['Save a project with ~project save [name]']
            );
            if (context.replied || context.deferred) return context.editReply({ embeds: [embed], ephemeral: true });
            return context.reply({ embeds: [embed] });
        }

        const embed = client.ui.createProjectListEmbed(projects);

        // If it's a menu interaction, we update the embed
        if (context.isStringSelectMenu && context.isStringSelectMenu()) {
            await context.update({
                embeds: [embed],
                files: client.ui.getCommonIcons(['logo.svg']),
                components: [] // Remove the menu to avoid confusion, or we could keep it.
                // Keeping it allows further actions. Let's keep the menu logic in interactionCreate if we want that.
                // But handleList is a terminal action here.
            });
        } else {
            await context.reply({
                embeds: [embed],
                files: client.ui.getCommonIcons(['logo.svg'])
            });
        }
    },

    async handleDelete(context, args, client) {
        const userId = context.author ? context.author.id : context.user.id;
        const projectName = Array.isArray(args) ? args.slice(1).join(' ') : args;

        const reply = (opts) => {
            if (context.replied || context.deferred) return context.editReply(opts);
            return context.reply(opts);
        };

        if (!projectName) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_015',
                'No project name provided',
                ['Example: ~project delete MyTrack']
            );
            return reply({ embeds: [embed], ephemeral: true });
        }

        const projects = client.db.getUserProjects(userId);
        const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());

        if (!project) {
            const embed = client.ui.createErrorEmbed(
                'ERR_PROJECT_002',
                'Project not found',
                [`No project named "${projectName}"`]
            );
            return reply({ embeds: [embed], ephemeral: true });
        }

        client.db.deleteProject(project.id);

        const embed = client.ui.createSuccessEmbed(
            'Project Deleted',
            `**${project.name}** has been removed from your library`,
            []
        );

        await reply({
            embeds: [embed],
            files: client.ui.getCommonIcons(['logo.svg', 'stop_icon.svg'])
        });
    }
};
