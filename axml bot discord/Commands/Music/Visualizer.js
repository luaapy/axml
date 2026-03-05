const { AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'visualize',
    aliases: ['viz', 'roll', 'pianoroll', 'graph'],
    description: 'Generate a high-quality piano roll visualization of your music',
    category: 'music',
    usage: '~visualize',
    examples: ['~visualize'],

    async execute(message, args, client) {
        const userSessions = client.sessions.getUserSessions(message.author.id);

        if (userSessions.length === 0) {
            // Check for saved projects to visualize
            const projects = client.db.getUserProjects(message.author.id);

            if (projects.length > 0) {
                const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

                const embed = new EmbedBuilder()
                    .setColor(0x00FBFF)
                    .setTitle('🎹 **Visualize Music**')
                    .setDescription('No active session found. You can visualize a saved project instead:')
                    .setFooter({ text: 'AXML Studio Pro' });

                const options = projects.map(p => ({
                    label: p.name,
                    description: `Tracks: ${p.metadata?.tracks?.length || '?'}`,
                    value: p.name,
                    emoji: '🎨'
                })).slice(0, 24);

                options.push({ label: 'Cancel', value: 'cancel_render', emoji: '❌' });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('render_project_select') // Reusing this ID as it triggers handleLoad which sets up a session + viz
                    .setPlaceholder('Select a project to visualize...')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(menu);

                return message.reply({ embeds: [embed], components: [row] });
            }

            const embed = client.ui.createErrorEmbed(
                'ERR_SESSION_001',
                'No active session found',
                ['Create music with `~gen`', 'Load a project with `~project load`', 'Or upload an .axml file with `~render`']
            );
            return message.reply({ embeds: [embed] });
        }

        const latestSession = userSessions[userSessions.length - 1];
        const processingEmbed = client.ui.createProcessingEmbed('Rendering piano roll visualization...', 45);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            const buffer = await renderPianoRoll(latestSession.parsed, client);

            const filename = `viz_${Date.now()}.png`;
            const tempPath = path.join(client.config.paths?.temp || './temp', filename);
            fs.writeFileSync(tempPath, buffer);

            const embed = client.ui.createSuccessEmbed(
                '🎨 Visualizer Complete',
                `**Track Name:** ${latestSession.parsed.metadata?.title || 'Untitled'}\n**Artist:** ${latestSession.parsed.metadata?.artist || 'AI Pro'}\n**Tempo:** ${latestSession.parsed.metadata?.tempo || 120} BPM`,
                [
                    { name: 'Resolution', value: '1200x600', inline: true },
                    { name: 'Total Tracks', value: latestSession.parsed.tracks.length.toString(), inline: true }
                ],
                'logo.svg'
            );

            embed.setImage(`attachment://${filename}`);

            const attachment = new AttachmentBuilder(tempPath, { name: filename });
            const iconAttachments = await client.ui.getCommonIconAttachments(client, ['logo.svg']);

            await processingMsg.edit({
                embeds: [embed],
                files: [attachment, ...iconAttachments]
            });

            // Auto cleanup after 2 minutes
            setTimeout(() => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }, 120000);

        } catch (error) {
            console.error('Viz Error:', error);
            const errorEmbed = client.ui.createErrorEmbed(
                'ERR_VIZ_002',
                `Failed to render visualization: ${error.message}`,
                ['The AXML data might be too complex or invalid']
            );
            await processingMsg.edit({ embeds: [errorEmbed] });
        }
    }
};

async function renderPianoRoll(axmlData, client) {
    const width = 1200;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0f0f15');
    bgGradient.addColorStop(1, '#050508');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Grid Settings
    const pianoWidth = 60;
    const headerHeight = 80;
    const mainHeight = height - headerHeight;
    const totalNotes = 84; // 7 octaves
    const noteHeight = mainHeight / totalNotes;
    const themeColor = client.config.theme?.primary || '#00FFFF';

    // Header Background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, headerHeight);

    // Header Text
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`🎹 ${axmlData.metadata?.title || 'Untitled'}`, 30, 50);

    // Draw Piano Keys and Horizontal Grid
    for (let i = 0; i < totalNotes; i++) {
        const y = headerHeight + (i * noteHeight);
        const pitchClass = (totalNotes - 1 - i) % 12;
        const isBlack = [1, 3, 6, 8, 10].includes(pitchClass);

        // Horizontal Line
        ctx.strokeStyle = isBlack ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(pianoWidth, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Piano Key
        ctx.fillStyle = isBlack ? '#111111' : '#f0f0f0';
        ctx.fillRect(0, y, pianoWidth, noteHeight);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(0, y, pianoWidth, noteHeight);
    }

    // Vertical Time Grid
    let maxBeats = 16;
    axmlData.tracks.forEach(t => {
        let pos = 0;
        (t.notes || []).forEach(n => {
            const s = (n.start !== null && n.start !== undefined) ? n.start : pos;
            maxBeats = Math.max(maxBeats, s + (n.duration || 1));
            pos = s + (n.duration || 1);
        });
    });

    const gridBeats = Math.ceil(maxBeats / 4) * 4;
    const pixelPerBeat = (width - pianoWidth - 40) / gridBeats;

    for (let b = 0; b <= gridBeats; b++) {
        const x = pianoWidth + (b * pixelPerBeat);
        ctx.strokeStyle = b % 4 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(x, headerHeight);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Draw Notes
    axmlData.tracks.forEach((track, trackIndex) => {
        const color = `hsl(${(trackIndex * 137.5) % 360}, 85%, 60%)`;
        let currentPos = 0;

        (track.notes || []).forEach(note => {
            const start = (note.start !== null && note.start !== undefined) ? note.start : currentPos;
            const duration = note.duration || 1;

            if (note.pitch !== 'rest') {
                const pitch = pitchToNumber(note.pitch);
                if (pitch !== null) {
                    const normalizedPitch = pitch - 24; // Offset to fit grid
                    if (normalizedPitch >= 0 && normalizedPitch < totalNotes) {
                        const x = pianoWidth + (start * pixelPerBeat) + 1;
                        const w = Math.max(3, (duration * pixelPerBeat) - 2);
                        const y = headerHeight + ((totalNotes - 1 - normalizedPitch) * noteHeight) + 1;
                        const h = noteHeight - 2;

                        // Note Body
                        ctx.fillStyle = color;
                        ctx.globalAlpha = note.velocity || 0.8;
                        roundRect(ctx, x, y, w, h, 3);
                        ctx.fill();

                        // Note Reflection/Glow
                        ctx.globalAlpha = 0.3;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(x + 1, y + 1, w - 2, h / 2);
                        ctx.globalAlpha = 1.0;
                    }
                }
            }
            currentPos = start + duration;
        });
    });

    return canvas.toBuffer('image/png');
}

function pitchToNumber(pitch) {
    const noteMap = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 };
    const match = String(pitch).match(/^([A-G][#b]?)(\d)$/);
    if (!match) return null;
    return noteMap[match[1]] + (parseInt(match[2]) * 12);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
