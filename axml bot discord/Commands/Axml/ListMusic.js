module.exports = {
    name: 'listmusic',
    aliases: ['mytracks', 'sessions-list'],
    description: 'List all music in your current activity (Alias for ~sessions)',
    category: 'axml',
    usage: '~listmusic',
    examples: ['~listmusic'],

    async execute(message, args, client) {
        const sessionsCommand = client.commands.get('sessions');
        if (sessionsCommand) {
            return sessionsCommand.execute(message, ['list'], client);
        } else {
            return message.reply('❌ Session manager is currently unavailable.');
        }
    }
};
