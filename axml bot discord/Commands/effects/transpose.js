module.exports = {
    name: 'transpose',
    aliases: ['trans', 'pitch', 'shift'],
    description: 'Transpose the current session by semitones',
    category: 'effects',
    usage: '~transpose [+/-semitones]',
    examples: ['~transpose +5', '~transpose -3', '~transpose +12'],

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

            const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

            const embed = new EmbedBuilder()
                .setColor(0x00FBFF)
                .setTitle('🎼 **Transpose Session**')
                .setDescription('Select a pitch shift interval from the menu below:')
                .setFooter({ text: 'AXML Studio Pro' });

            const options = [
                { label: '-12 Semitones (Octave Down)', value: '-12', description: 'Deep & Heavy', emoji: '⬇️' },
                { label: '-5 Semitones', value: '-5', description: 'Lower', emoji: '📉' },
                { label: '-2 Semitones', value: '-2', description: 'Slightly Lower', emoji: '🔉' },
                { label: '+2 Semitones', value: '2', description: 'Slightly Higher', emoji: '🔊' },
                { label: '+5 Semitones', value: '5', description: 'Higher', emoji: '📈' },
                { label: '+7 Semitones (Perfect 5th)', value: '7', description: 'Harmonic Shift', emoji: '🎶' },
                { label: '+12 Semitones (Octave Up)', value: '12', description: 'Bright & Airy', emoji: '⬆️' }
            ];

            const menu = new StringSelectMenuBuilder()
                .setCustomId('transpose_select')
                .setPlaceholder('Select semitones...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(menu);

            return message.reply({
                embeds: [embed],
                components: [row]
            });
        }

        const semitones = parseInt(args[0]);

        if (isNaN(semitones) || semitones < -12 || semitones > 12) {
            const embed = client.ui.createErrorEmbed(
                'ERR_INPUT_006',
                'Invalid transpose value',
                ['Must be a number between -12 and +12', `You provided: ${args[0]}`]
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

        const processingEmbed = client.ui.createProcessingEmbed('Transposing composition...', 50);
        const processingMsg = await message.reply({ embeds: [processingEmbed] });

        try {
            const latestSession = userSessions[userSessions.length - 1];
            const transposed = transposeAXML(latestSession.parsed, semitones);

            await processingMsg.edit({
                embeds: [client.ui.createProcessingEmbed('Re-synthesizing audio...', 75)]
            });

            const audioResult = await client.audio.synthesize(transposed);

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

            const wavFilename = `transpose_${message.author.id}_${timestamp}.wav`;
            const pngFilename = `transpose_${message.author.id}_${timestamp}.png`;

            const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);

            const svgContent = client.svg.generatePianoRoll(transposed);
            const pngBuffer = await client.svg.svgToPng(svgContent);
            const pngPath = path.join(client.config.paths?.temp || './temp', pngFilename);
            fs.writeFileSync(pngPath, pngBuffer);

            const newKey = transposeKey(transposed.metadata.key, semitones);

            const sessionId = client.sessions.createSession(message.author.id, {
                axml: latestSession.axml,
                parsed: transposed,
                audioPath: wavPath,
                imagePath: pngPath,
                xmlPath: latestSession.xmlPath
            });

            const embed = client.ui.createSuccessEmbed(
                'Transposition Complete',
                `**Track:** ${transposed.metadata.title}\n**Original Key:** ${latestSession.parsed.metadata.key}\n**New Key:** ${newKey}\n**Shift:** ${semitones > 0 ? '+' : ''}${semitones} semitones`,
                [
                    { name: 'Tempo', value: `${transposed.metadata.tempo} BPM`, inline: true },
                    { name: 'New Key', value: newKey, inline: true },
                    { name: 'Duration', value: client.ui.formatDuration(audioResult.duration), inline: true }
                ]
            );

            embed.setImage(`attachment://${pngFilename}`);

            const attachments = [
                new AttachmentBuilder(pngPath, { name: pngFilename }),
                new AttachmentBuilder(wavPath, { name: wavFilename }),
                new AttachmentBuilder(await client.svg.getIconPng('logo.svg'), { name: 'logo.png' }),
                new AttachmentBuilder(await client.svg.getIconPng('settings_icon.svg'), { name: 'settings_icon.png' })
            ];

            const components = [
                client.ui.createTransportControls(),
                client.ui.createFileOperations()
            ];

            await processingMsg.edit({
                content: `### ✅ **Pitch Transposed: ${semitones > 0 ? '+' : ''}${semitones} Semitones**`,
                embeds: [embed],
                files: attachments,
                components: components
            });

        } catch (error) {
            console.error('Transpose Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_SYS_003',
                `Transpose failed: ${error.message}`,
                ['Try a smaller transpose value', 'Check your session is valid']
            );
            await processingMsg.edit({ embeds: [embed] });
        }
    },
    async handleInteraction(interaction, client, value) {
        const semitones = parseInt(value);
        const userSessions = client.sessions.getUserSessions(interaction.user.id);

        if (userSessions.length === 0) {
            return interaction.update({
                content: '❌ No active session found.',
                embeds: [],
                components: []
            });
        }

        const processingEmbed = client.ui.createProcessingEmbed('Transposing composition...', 50);
        await interaction.update({ embeds: [processingEmbed], components: [] }); // Clear menu

        // Helper to edit the message later (interaction.editReply if deferred, or just edit the message we updated)
        // Since we did update(), we can use editReply
        const editMsg = async (opts) => interaction.editReply(opts);

        try {
            const latestSession = userSessions[userSessions.length - 1];
            const transposed = transposeAXML(latestSession.parsed, semitones);

            await editMsg({
                embeds: [client.ui.createProcessingEmbed('Re-synthesizing audio...', 75)]
            });

            const audioResult = await client.audio.synthesize(transposed);

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

            const wavFilename = `transpose_${interaction.user.id}_${timestamp}.wav`;
            const pngFilename = `transpose_${interaction.user.id}_${timestamp}.png`;

            const wavPath = await client.audio.saveToFile(audioResult.buffer, wavFilename);

            const svgContent = client.svg.generatePianoRoll(transposed);
            const pngBuffer = await client.svg.svgToPng(svgContent);
            const pngPath = path.join(client.config.paths?.temp || './temp', pngFilename);
            fs.writeFileSync(pngPath, pngBuffer);

            const newKey = transposeKey(transposed.metadata.key, semitones);

            // Create new session
            client.sessions.createSession(interaction.user.id, {
                axml: latestSession.axml,
                parsed: transposed,
                audioPath: wavPath,
                imagePath: pngPath,
                xmlPath: latestSession.xmlPath
            });

            const embed = client.ui.createSuccessEmbed(
                'Transposition Complete',
                `**Track:** ${transposed.metadata.title}\n**Original Key:** ${latestSession.parsed.metadata.key}\n**New Key:** ${newKey}\n**Shift:** ${semitones > 0 ? '+' : ''}${semitones} semitones`,
                [
                    { name: 'Tempo', value: `${transposed.metadata.tempo} BPM`, inline: true },
                    { name: 'New Key', value: newKey, inline: true },
                    { name: 'Duration', value: client.ui.formatDuration(audioResult.duration), inline: true }
                ]
            );

            embed.setImage(`attachment://${pngFilename}`);

            const attachments = [
                new AttachmentBuilder(pngPath, { name: pngFilename }),
                new AttachmentBuilder(wavPath, { name: wavFilename }),
                new AttachmentBuilder(await client.svg.getIconPng('logo.svg'), { name: 'logo.png' }),
                new AttachmentBuilder(await client.svg.getIconPng('settings_icon.svg'), { name: 'settings_icon.png' })
            ];

            const components = [
                client.ui.createTransportControls(),
                client.ui.createFileOperations()
            ];

            await editMsg({
                content: `### ✅ **Pitch Transposed: ${semitones > 0 ? '+' : ''}${semitones} Semitones**`,
                embeds: [embed],
                files: attachments,
                components: components
            });

        } catch (error) {
            console.error('Transpose Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_SYS_003',
                `Transpose failed: ${error.message}`,
                ['Try a smaller transpose value', 'Check your session is valid']
            );
            await editMsg({ embeds: [embed] });
        }
    }
};

function transposeAXML(axmlData, semitones) {
    const transposed = JSON.parse(JSON.stringify(axmlData));

    transposed.tracks.forEach(track => {
        track.notes.forEach(note => {
            if (note.type === 'chord') {
                note.notes.forEach(chordNote => {
                    chordNote.pitch = transposePitch(chordNote.pitch, semitones);
                });
            } else if (note.pitch !== 'rest') {
                note.pitch = transposePitch(note.pitch, semitones);
            }
        });
    });

    transposed.metadata.key = transposeKey(transposed.metadata.key, semitones);

    return transposed;
}

function transposePitch(pitch, semitones) {
    if (pitch === 'rest') return pitch;

    const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = pitch.match(/^([A-G][#b]?)(\d)$/);

    if (!match) return pitch;

    const [, note, octave] = match;
    let octaveNum = parseInt(octave);

    const noteIndex = noteMap.indexOf(note.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#')
        .replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#'));

    if (noteIndex === -1) return pitch;

    let newNoteIndex = noteIndex + semitones;
    let newOctave = octaveNum;

    while (newNoteIndex < 0) {
        newNoteIndex += 12;
        newOctave--;
    }

    while (newNoteIndex >= 12) {
        newNoteIndex -= 12;
        newOctave++;
    }

    if (newOctave < 0) newOctave = 0;
    if (newOctave > 8) newOctave = 8;

    return noteMap[newNoteIndex] + newOctave;
}

function transposeKey(key, semitones) {
    const isMinor = key.includes('m');
    const root = key.replace('m', '');

    const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteMap.indexOf(root);

    if (rootIndex === -1) return key;

    let newIndex = (rootIndex + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    return noteMap[newIndex] + (isMinor ? 'm' : '');
}
