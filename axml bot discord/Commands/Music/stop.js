module.exports = {
    name: 'stop',
    aliases: ['leave', 'disconnect'],
    description: 'Stop playback and leave voice channel',
    category: 'music',
    usage: '~stop',
    examples: ['~stop'],

    async execute(message, args, client) {
        const { getVoiceConnection } = require('@discordjs/voice');

        const connection = getVoiceConnection(message.guild.id);

        if (!connection) {
            const embed = client.ui.createErrorEmbed(
                'ERR_VOICE_003',
                'Bot not in voice channel',
                ['Use ~play to start playback first']
            );
            return message.reply({ embeds: [embed] });
        }

        try {
            // Clean up player
            if (client.musicPlayers && client.musicPlayers.has(message.guild.id)) {
                const { player } = client.musicPlayers.get(message.guild.id);
                player.stop();
                client.musicPlayers.delete(message.guild.id);
            }

            connection.destroy();

            const embed = client.ui.createSuccessEmbed(
                'Stopped',
                '⏹️ Playback stopped and disconnected from voice',
                [],
                'stop_icon.svg'
            );

            if (typeof client.ui.getCommonIcons === 'function') {
                await message.reply({
                    embeds: [embed],
                    files: client.ui.getCommonIcons(['stop_icon.svg'])
                });
            } else {
                await message.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Stop Error:', error);
            const embed = client.ui.createErrorEmbed(
                'ERR_VOICE_004',
                `Failed to stop: ${error.message}`,
                []
            );
            await message.reply({
                embeds: [embed],
                files: client.ui.getCommonIcons(['stop_icon.svg'])
            });
        }
    }
};
