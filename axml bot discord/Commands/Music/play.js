const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
    name: 'play',
    aliases: ['p', 'start'],
    description: 'Play the current session in voice channel',
    category: 'music',
    usage: '~play',
    examples: ['~play'],

    async execute(message, args, client) {
        const voiceChannel = message.member?.voice?.channel;

        if (!voiceChannel) {
            return message.reply('🎧 **You\'re not in a voice channel!** Please join a voice channel and click play again.');
        }

        const userSessions = client.sessions.getUserSessions(message.author.id);

        if (userSessions.length === 0) {
            return message.reply('🎵 **No music to play!** Generate some music first with `~gen [your prompt]`');
        }

        const latestSession = userSessions[userSessions.length - 1];

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(latestSession.audioPath);

            player.play(resource);
            connection.subscribe(player);

            // Store player info
            if (!client.musicPlayers) {
                client.musicPlayers = new Map();
            }
            client.musicPlayers.set(message.guild.id, { player, connection, session: latestSession });

            player.on(AudioPlayerStatus.Playing, () => {
                console.log(`🎵 Now playing in ${message.guild.name}`);
            });

            player.on(AudioPlayerStatus.Idle, () => {
                console.log(`⏹️ Playback finished in ${message.guild.name}`);
            });

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                console.log(`🔌 Disconnected from ${voiceChannel.name}`);
                client.musicPlayers.delete(message.guild.id);
            });

            const embed = client.ui.createSuccessEmbed(
                'Now Playing',
                `🎵 **${latestSession.parsed.metadata.title}**\n**Artist:** ${latestSession.parsed.metadata.artist}\n**Channel:** ${voiceChannel.name}`,
                [
                    { name: 'Tempo', value: `${latestSession.parsed.metadata.tempo} BPM`, inline: true },
                    { name: 'Key', value: latestSession.parsed.metadata.key, inline: true },
                    { name: 'Tracks', value: latestSession.parsed.tracks.length.toString(), inline: true }
                ],
                'play_icon.svg'
            );

            // Debug UI and icons
            if (typeof client.ui.getCommonIcons !== 'function') {
                console.error('[DEBUG] client.ui.getCommonIcons is MISSING!');
                console.error('[DEBUG] client.ui properties:', Object.keys(client.ui));
                await message.reply({ embeds: [embed] });
            } else {
                await message.reply({
                    embeds: [embed],
                    files: client.ui.getCommonIcons(['play_icon.svg'])
                });
            }

        } catch (error) {
            console.error('Voice Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_VOICE_002',
                `Failed to join voice: ${error.message}`,
                ['Check bot permissions', 'Ensure bot can connect to voice']
            );
            await message.reply({
                embeds: [embed],
                files: client.ui.getCommonIcons(['stop_icon.svg'])
            });
        }
    }
};
