module.exports = {
    name: 'pause',
    aliases: ['hold'],
    description: 'Pause the current audio playback',
    category: 'music',
    usage: '~pause',
    examples: ['~pause'],

    async execute(message, args, client) {
        const musicPlayer = client.musicPlayers?.get(message.guild.id);

        if (!musicPlayer) {
            return message.reply('❌ **Not playing!** Use `~play` to start music first.');
        }

        try {
            if (musicPlayer.player.pause()) {
                message.reply('⏸️ **Playback Paused**');
            } else {
                message.reply('⚠️ **Playback is already paused or cannot be paused.**');
            }
        } catch (error) {
            message.reply(`❌ **Pause Error:** ${error.message}`);
        }
    }
};
