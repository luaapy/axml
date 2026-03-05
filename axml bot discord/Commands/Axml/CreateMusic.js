module.exports = {
    name: 'createmusic',
    aliases: ['new', 'compose'],
    description: 'Start a new music creation session (Alias for ~gen)',
    category: 'axml',
    usage: '~createmusic [prompt]',
    examples: ['~createmusic a happy piano song'],

    async execute(message, args, client) {
        const genCommand = client.commands.get('gen');
        if (genCommand) {
            return genCommand.execute(message, args, client);
        } else {
            return message.reply('❌ Generation system is currently unavailable.');
        }
    }
};
