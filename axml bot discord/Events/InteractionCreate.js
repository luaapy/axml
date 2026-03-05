const projectCmd = require('../Commands/Tools/project.js');

module.exports = {
    name: 'interactionCreate',
    once: false,

    async execute(interaction, client) {
        // Logging
        const type = interaction.isChatInputCommand() ? 'SLASH_CMD' :
            interaction.isButton() ? 'BUTTON' :
                interaction.isStringSelectMenu() ? 'MENU' :
                    interaction.isModalSubmit() ? 'MODAL' : 'UNKNOWN';

        const name = interaction.commandName || interaction.customId || 'unknown';
        const user = `${interaction.user.tag} (${interaction.user.id})`;
        const guild = interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM';

        const logMsg = `INT: \x1b[36m${type}\x1b[0m | Name: \x1b[33m${name}\x1b[0m | User: ${interaction.user.tag} | Guild: ${interaction.guild?.name || 'DM'}`;

        if (client.logger) {
            client.logger.info(logMsg);
        } else {
            console.log(`[INFO] ${logMsg}`);
        }

        try {
            if (interaction.isButton()) {
                await handleButtonInteraction(interaction, client);
            } else if (interaction.isStringSelectMenu()) {
                await handleMenuInteraction(interaction, client);
            } else if (interaction.isModalSubmit()) {
                await handleModalInteraction(interaction, client);
            }
        } catch (error) {
            console.error('Interaction Error:', error);

            const errorEmbed = client.ui.createErrorEmbed(
                'ERR_INT_001',
                'Interaction failed: ' + error.message,
                ['Try the action again', 'Check your session is still active']
            );

            if (!interaction.replied && !interaction.deferred) {
                const attachments = await client.ui.getCommonIconAttachments(client, ['stop_icon.svg']);
                await interaction.reply({ embeds: [errorEmbed], files: attachments, ephemeral: true }).catch(() => { });
            }
        }
    }
};

// ... existing code ...

async function handleMenuInteraction(interaction, client) {
    const { customId, values } = interaction;

    switch (customId) {
        case 'menu_select_instrument':
            await interaction.reply({
                content: `🎹 Selected instruments: ${values.join(', ')}`,
                ephemeral: true
            });
            break;
        case 'menu_select_effects':
            await interaction.reply({
                content: `🎛️ Selected effects: ${values.join(', ')}\n*Effect processing will be added in next update*`,
                ephemeral: true
            });
            break;
        case 'help_menu_select':
            await handleHelpCategory(interaction, client, values[0]);
            break;

        // Project Menu Handlers
        case 'project_menu':
            await handleProjectMenuSelection(interaction, client, values[0]);
            break;
        case 'project_load_select':
            await projectCmd.handleLoad(interaction, values[0], client);
            break;
        case 'project_delete_select':
            await projectCmd.handleDelete(interaction, values[0], client);
            break;

        case 'render_project_select':
            if (values[0] === 'cancel_render') {
                await interaction.update({ content: '❌ Render cancelled.', embeds: [], components: [] });
            } else {
                await projectCmd.handleLoad(interaction, values[0], client);
            }
            break;

        case 'transpose_select':
            await client.commands.get('transpose').handleInteraction(interaction, client, values[0]);
            break;

        case 'tempo_select':
            await client.commands.get('tempo').handleInteraction(interaction, client, values[0]);
            break;

        default:
            await interaction.reply({ content: '⚠️ Unknown menu', ephemeral: true });
    }
}

async function handleModalInteraction(interaction, client) {
    const { customId } = interaction;

    switch (customId) {
        case 'modal_ai_generate':
            await handleAIGenerateModal(interaction, client);
            break;
        case 'modal_project_save':
            const name = interaction.fields.getTextInputValue('input_project_name');
            await projectCmd.handleSave(interaction, name, client);
            break;
        default:
            await interaction.reply({ content: '⚠️ Unknown modal', ephemeral: true });
    }
}

async function handleProjectMenuSelection(interaction, client, action) {
    const { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    const userId = interaction.user.id;
    const projects = client.db.getUserProjects(userId);

    if (action === 'list') {
        return projectCmd.handleList(interaction, client);
    }

    if (action === 'save') {
        const modal = new ModalBuilder()
            .setCustomId('modal_project_save')
            .setTitle('Save Project');

        const nameInput = new TextInputBuilder()
            .setCustomId('input_project_name')
            .setLabel("Project Name")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. My Awesome Track")
            .setRequired(true)
            .setMaxLength(32);

        const row = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(row);

        return interaction.showModal(modal);
    }

    if (action === 'load' || action === 'delete') {
        if (projects.length === 0) {
            return interaction.reply({ content: '❌ No saved projects found.', ephemeral: true });
        }

        const options = projects.map(p => ({
            label: p.name,
            description: `ID: ${p.id} • Tracks: ${p.metadata?.tracks?.length || '?'}`,
            value: p.name,
            emoji: '🎵'
        })).slice(0, 25); // Discord limit

        const menu = new StringSelectMenuBuilder()
            .setCustomId(action === 'load' ? 'project_load_select' : 'project_delete_select')
            .setPlaceholder(action === 'load' ? 'Select project to load...' : 'Select project to DELETE...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
            content: `📂 **Select a project to ${action}:**`,
            components: [row],
            ephemeral: true
        });
    }
}

async function handleButtonInteraction(interaction, client) {
    const { customId, user } = interaction;

    const userSessions = client.sessions.getUserSessions(user.id);

    switch (customId) {
        case 'btn_play':
            await handlePlayButton(interaction, client, userSessions);
            break;
        case 'btn_pause':
            await handlePauseButton(interaction, client);
            break;
        case 'btn_stop':
            await handleStopButton(interaction, client);
            break;
        case 'btn_export_wav':
            await handleExportWav(interaction, client, userSessions);
            break;
        case 'btn_export_xml':
            await handleExportXml(interaction, client, userSessions);
            break;
        case 'btn_export_midi':
            await handleExportMidi(interaction, client, userSessions);
            break;
        case 'btn_visualize':
            await handleVisualize(interaction, client, userSessions);
            break;
        case 'btn_edit_code':
            await handleEditCode(interaction, client, userSessions);
            break;
        case 'btn_effects':
            await handleEffects(interaction, client);
            break;
        case 'btn_mixer':
            await handleMixer(interaction, client, userSessions);
            break;
        case 'help_creation':
        case 'help_playback':
        case 'help_files':
        case 'help_tools':
        case 'help_all':
            await handleHelpCategory(interaction, client, customId.replace('help_', ''));
            break;
        default:
            await interaction.reply({ content: '⚠️ This button is not yet implemented.', ephemeral: true });
    }
}

async function handlePlayButton(interaction, client, sessions) {
    if (sessions.length === 0) {
        const embed = client.ui.createErrorEmbed(
            'ERR_SESSION_001',
            'No active session found',
            ['Generate music with ~gen first', 'Or render an AXML file with ~render']
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
        const embed = client.ui.createErrorEmbed(
            'ERR_VOICE_001',
            'You must be in a voice channel',
            ['Join a voice channel first', 'Then try playing again']
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
    const latestSession = sessions[sessions.length - 1];

    try {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(latestSession.audioPath);

        player.play(resource);
        connection.subscribe(player);

        if (!client.musicPlayers) {
            client.musicPlayers = new Map();
        }
        client.musicPlayers.set(interaction.guildId, { player, connection, session: latestSession });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('🎵 Now playing audio');
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('⏹️ Playback finished');
            // Optional: Disconnect after a delay if desired
        });

        const embed = client.ui.createSuccessEmbed(
            'Now Playing',
            `🎵 **${latestSession.parsed.metadata.title}**\n**Artist:** ${latestSession.parsed.metadata.artist}`,
            [
                { name: 'Tempo', value: `${latestSession.parsed.metadata.tempo} BPM`, inline: true },
                { name: 'Key', value: latestSession.parsed.metadata.key, inline: true }
            ]
        );

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Voice Error:', error);
        const embed = client.ui.createErrorEmbed(
            'ERR_VOICE_002',
            `Failed to join voice channel: ${error.message}`,
            ['Check bot permissions', 'Make sure the bot can connect to voice']
        );
        await interaction.editReply({ embeds: [embed] });
    }
}

async function handlePauseButton(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const musicPlayer = client.musicPlayers?.get(interaction.guildId);

    if (!musicPlayer) {
        return interaction.editReply('❌ **Not playing!** Use `~play` or the Play button first.');
    }

    try {
        const status = musicPlayer.player.state.status;
        const { AudioPlayerStatus } = require('@discordjs/voice');

        if (status === AudioPlayerStatus.Paused) {
            musicPlayer.player.unpause();
            await interaction.editReply('▶️ **Playback Resumed**');
        } else {
            musicPlayer.player.pause();
            await interaction.editReply('⏸️ **Playback Paused**');
        }
    } catch (error) {
        console.error('Pause Error:', error);
        await interaction.editReply(`❌ **Error:** ${error.message}`);
    }
}

async function handleStopButton(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const { getVoiceConnection } = require('@discordjs/voice');
    const connection = getVoiceConnection(interaction.guildId);

    if (!connection) {
        return interaction.editReply('⚠️ **Bot is not in a voice channel.**');
    }

    try {
        if (client.musicPlayers && client.musicPlayers.has(interaction.guildId)) {
            const { player } = client.musicPlayers.get(interaction.guildId);
            player.stop();
            client.musicPlayers.delete(interaction.guildId);
        }

        connection.destroy();
        await interaction.editReply('⏹️ **Playback stopped and disconnected**');
    } catch (error) {
        console.error('Stop Error:', error);
        await interaction.editReply(`❌ **Error:** ${error.message}`);
    }
}

async function handleExportWav(interaction, client, sessions) {
    if (sessions.length === 0) {
        return interaction.reply({ content: '❌ No session found. Generate music first!', ephemeral: true });
    }

    await interaction.deferReply();

    const latestSession = sessions[sessions.length - 1];
    const { AttachmentBuilder } = require('discord.js');

    const attachment = new AttachmentBuilder(latestSession.audioPath, {
        name: `${latestSession.parsed.metadata.title.replace(/\s+/g, '_')}.wav`
    });

    const embed = client.ui.createSuccessEmbed(
        'WAV Export Complete',
        `**Track:** ${latestSession.parsed.metadata.title}\n**Format:** 48kHz/24-bit Stereo WAV`,
        [
            { name: 'Sample Rate', value: '48000 Hz', inline: true },
            { name: 'Bit Depth', value: '24-bit', inline: true },
            { name: 'Channels', value: 'Stereo', inline: true }
        ]
    );

    await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleExportXml(interaction, client, sessions) {
    if (sessions.length === 0) {
        return interaction.reply({ content: '❌ No session found. Generate music first!', ephemeral: true });
    }

    await interaction.deferReply();

    const latestSession = sessions[sessions.length - 1];
    const { AttachmentBuilder } = require('discord.js');

    const attachment = new AttachmentBuilder(latestSession.xmlPath, {
        name: `${latestSession.parsed.metadata.title.replace(/\s+/g, '_')}.axml`
    });

    const embed = client.ui.createSuccessEmbed(
        'AXML Export Complete',
        `**Track:** ${latestSession.parsed.metadata.title}\n**Format:** AXML 1.0 (Audio XML)`,
        [
            { name: 'Standard', value: 'AXML 1.0', inline: true },
            { name: 'Encoding', value: 'UTF-8', inline: true }
        ]
    );

    await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleExportMidi(interaction, client, sessions) {
    await interaction.reply({ content: '🎹 MIDI export is in development. Use WAV for now!', ephemeral: true });
}

async function handleVisualize(interaction, client, sessions) {
    if (sessions.length === 0) {
        return interaction.reply({ content: '❌ No session found. Generate music first!', ephemeral: true });
    }

    await interaction.deferReply();

    const latestSession = sessions[sessions.length - 1];
    const { AttachmentBuilder } = require('discord.js');

    const attachment = new AttachmentBuilder(latestSession.imagePath || latestSession.svgPath, {
        name: 'visualization.png'
    });

    const embed = client.ui.createSuccessEmbed(
        'Visualization',
        `**Track:** ${latestSession.parsed.metadata.title}`,
        []
    );

    embed.setImage('attachment://visualization.png');

    await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleEditCode(interaction, client, sessions) {
    if (sessions.length === 0) {
        return interaction.reply({ content: '❌ No session found. Generate music first!', ephemeral: true });
    }

    const modal = client.ui.createAIGeneratorModal();
    await interaction.showModal(modal);
}

async function handleEffects(interaction, client) {
    const effectsMenu = client.ui.createEffectSelector();
    await interaction.reply({
        content: '🎛️ **Select audio effects to apply:**',
        components: [effectsMenu],
        ephemeral: true
    });
}

async function handleMixer(interaction, client, sessions) {
    if (sessions.length === 0) {
        return interaction.reply({ content: '❌ No session found. Generate music first!', ephemeral: true });
    }

    const latestSession = sessions[sessions.length - 1];
    const tracks = latestSession.parsed.tracks;

    const trackInfo = tracks.map((track, i) =>
        `**Track ${i + 1}:** ${track.name} (${track.notes.length} notes)`
    ).join('\n');

    const embed = client.ui.createSuccessEmbed(
        'Track Mixer',
        trackInfo,
        [
            { name: 'Total Tracks', value: tracks.length.toString(), inline: true },
            { name: 'Instruments', value: latestSession.parsed.instruments.length.toString(), inline: true }
        ]
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

const helpCmd = require('../Commands/Tools/Help.js');

// ... existing code ...

async function handleHelpCategory(interaction, client, category) {
    const embed = await helpCmd.createCategoryEmbed(category, client);
    const helpMenu = helpCmd.createCategoryMenu();

    await interaction.update({
        embeds: [embed],
        components: [helpMenu],
        files: [] // No files needed as we use embed fields/descriptions
    });
}

async function handleMenuInteraction(interaction, client) {
    const { customId, values } = interaction;

    switch (customId) {
        case 'menu_select_instrument':
            await interaction.reply({
                content: `🎹 Selected instruments: ${values.join(', ')}`,
                ephemeral: true
            });
            break;
        case 'menu_select_effects':
            await interaction.reply({
                content: `🎛️ Selected effects: ${values.join(', ')}\n*Effect processing will be added in next update*`,
                ephemeral: true
            });
            break;
        case 'help_menu_select':
            await handleHelpCategory(interaction, client, values[0]);
            break;
        default:
            await interaction.reply({ content: '⚠️ Unknown menu', ephemeral: true });
    }
}

async function handleModalInteraction(interaction, client) {
    const { customId } = interaction;

    switch (customId) {
        case 'modal_ai_generate':
            await handleAIGenerateModal(interaction, client);
            break;
        default:
            await interaction.reply({ content: '⚠️ Unknown modal', ephemeral: true });
    }
}

async function handleAIGenerateModal(interaction, client) {
    await interaction.deferReply();

    const prompt = interaction.fields.getTextInputValue('input_prompt');
    const bpm = interaction.fields.getTextInputValue('input_bpm') || null;
    const key = interaction.fields.getTextInputValue('input_key') || null;

    let fullPrompt = prompt;
    if (bpm) fullPrompt += ` at ${bpm} BPM`;
    if (key) fullPrompt += ` in ${key}`;

    try {
        const result = await client.ai.generateFromPrompt(fullPrompt);
        const parseResult = await client.axml.parse(result.axml);

        if (!parseResult.success) {
            const embed = client.ui.createErrorEmbed(
                'ERR_AI_002',
                'AI generated invalid AXML',
                parseResult.errors.map(e => e.message)
            );
            return interaction.editReply({ embeds: [embed] });
        }

        const audioResult = await client.audio.synthesize(parseResult.data);

        if (!audioResult.success) {
            const embed = client.ui.createErrorEmbed(
                'ERR_AUDIO_001',
                'Audio synthesis failed',
                [audioResult.error]
            );
            return interaction.editReply({ embeds: [embed] });
        }

        const fs = require('fs');
        const path = require('path');
        const timestamp = Date.now();

        const wavFilename = `modal_${interaction.user.id}_${timestamp}.wav`;
        const pngFilename = `modal_${interaction.user.id}_${timestamp}.png`;
        const xmlFilename = `modal_${interaction.user.id}_${timestamp}.axml`;

        const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);

        const svgContent = generatePianoRoll(parseResult.data, client);
        const pngBuffer = await client.svg.svgToPng(svgContent);
        const pngPath = path.join(client.config.paths?.temp || './temp', pngFilename);
        fs.writeFileSync(pngPath, pngBuffer);

        const xmlPath = path.join(client.config.paths?.temp || './temp', xmlFilename);
        fs.writeFileSync(xmlPath, result.axml);

        const sessionId = client.sessions.createSession(interaction.user.id, {
            axml: result.axml,
            parsed: parseResult.data,
            audioPath: wavPath,
            imagePath: pngPath,
            xmlPath: xmlPath,
            prompt: fullPrompt,
            analysis: result.analysis
        });

        const { AttachmentBuilder } = require('discord.js');

        const embed = client.ui.createRenderCompleteEmbed(
            parseResult.data.metadata,
            audioResult.duration,
            pngFilename
        );

        const attachments = [
            new AttachmentBuilder(pngPath, { name: pngFilename }),
            new AttachmentBuilder(wavPath, { name: wavFilename })
        ];

        const components = [
            client.ui.createTransportControls(),
            client.ui.createFileOperations()
        ];

        await interaction.editReply({
            content: `### 🎵 **AI Generation Complete!**\n> Description: *"${prompt}"*`,
            embeds: [embed],
            files: attachments,
            components: components
        });

    } catch (error) {
        console.error('Modal AI Error:', error);
        const embed = client.ui.createErrorEmbed(
            'ERR_AI_003',
            `Generation failed: ${error.message}`,
            ['Try simplifying your prompt', 'Check your parameters']
        );
        await interaction.editReply({ embeds: [embed] });
    }
}

/**
 * Local SVG Piano Roll for Events
 */
function generatePianoRoll(axmlData, client) {
    const meta = axmlData.metadata || {};
    const tracks = axmlData.tracks || [];
    const width = client.config.axml?.imageWidth || 1200;
    const height = client.config.axml?.imageHeight || 600;
    const theme = client.config.theme || {};

    const svg = [];
    svg.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`);
    svg.push(`<defs>`);
    svg.push(`<linearGradient id="bgG" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#0f0f15"/><stop offset="100%" style="stop-color:#050508"/></linearGradient>`);
    svg.push(`<linearGradient id="nG" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:rgba(255,255,255,0.3)"/><stop offset="50%" style="stop-color:rgba(255,255,255,0)"/></linearGradient>`);
    svg.push(`<filter id="gl"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    svg.push(`</defs>`);
    svg.push(`<rect width="${width}" height="${height}" fill="url(#bgG)"/>`);
    svg.push(`<rect width="${width}" height="80" fill="rgba(0,0,0,0.5)"/><text x="30" y="45" fill="${theme.primary}" font-family="Arial" font-size="28" font-weight="bold">🎹 ${meta.title || 'Untitled'}</text>`);

    const pW = 60, pY = 80, pH = height - 80, tN = 84, nH = pH / tN;
    for (let i = 0; i < tN; i++) {
        const y = pY + (i * nH), isB = [1, 3, 6, 8, 10].includes((tN - 1 - i) % 12);
        svg.push(`<line x1="${pW}" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(255,255,255,${isB ? 0.03 : 0.08})"/>`);
        svg.push(`<rect x="0" y="${y}" width="${pW}" height="${nH}" fill="${isB ? '#111' : '#eee'}" stroke="#333" stroke-width="0.5"/>`);
    }

    let max = 0;
    tracks.forEach(t => { let c = 0; (t.notes || []).forEach(n => { const s = n.start !== null ? n.start : c; max = Math.max(max, s + n.duration); c = s + n.duration; }) });
    const pB = (width - pW - 40) / Math.max(16, Math.ceil(max / 4) * 4);

    tracks.forEach((t, j) => {
        const color = `hsl(${(j * 137.5) % 360}, 85%, 60%)`;
        let cB = 0;
        (t.notes || []).forEach(n => {
            const s = n.start !== null ? n.start : cB;
            if (n.pitch !== 'rest') {
                const p = (pitchToNumber(n.pitch) || 0) - 24;
                if (p >= 0 && p < tN) {
                    const x = pW + (s * pB) + 1, w = Math.max(2, n.duration * pB - 2), y = pY + ((tN - 1 - p) * pH / tN), h = (pH / tN) - 1;
                    svg.push(`<g filter="url(#gl)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" rx="2" style="fill-opacity:${n.velocity || 0.8}"/><rect x="${x}" y="${y}" width="${w}" height="${h / 2}" fill="url(#nG)" rx="2"/></g>`);
                }
            }
            cB = s + n.duration;
        });
    });
    return svg.join('\n') + '</svg>';
}

function pitchToNumber(p) {
    const m = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 }, r = p.match(/^([A-G][#b]?)(\d)$/);
    return r ? m[r[1]] + (parseInt(r[2]) * 12) : null;
}
