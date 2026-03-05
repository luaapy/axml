module.exports = {
    name: 'resume',
    aliases: ['unpause', 'continue'],
    description: 'Resume the paused audio playback',
    category: 'music',
    usage: '~resume',
    examples: ['~resume'],

    async execute(message, args, client) {
        const musicPlayer = client.musicPlayers?.get(message.guild.id);

        if (!musicPlayer) {
            return message.reply('❌ **Not playing!** Use `~play` to start music first.');
        }

        try {
            if (musicPlayer.player.unpause()) {
                message.reply('▶️ **Playback Resumed**');
            } else {
                message.reply('⚠️ **Playback is not paused or cannot be resumed.**');
            }
        } catch (error) {
            message.reply(`❌ **Resume Error:** ${error.message}`);
        }
    }
};
