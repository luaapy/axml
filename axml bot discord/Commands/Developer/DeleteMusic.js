module.exports = {
    name: 'deletemusic',
    aliases: ['rm', 'del'],
    description: 'Delete a music session or project (Admin/Developer only)',
    category: 'admin',
    usage: '~deletemusic [session_id]',
    examples: ['~deletemusic MTI0NjUw...'],

    async execute(message, args, client) {
        // Simple permission check
        if (!client.config.bot.owners.includes(message.author.id) && !message.member.permissions.has('Administrator')) {
            return message.reply('❌ **Unauthorized:** This command is for Developers/Admins only.');
        }

        const sessionId = args[0];
        if (!sessionId) {
            return message.reply('❌ **Error:** Please provide a Session ID to delete.');
        }

        try {
            if (client.sessions.endSession(sessionId)) {
                return message.reply(`✅ **Deleted:** Session \`${sessionId}\` has been removed from memory.`);
            } else {
                return message.reply('❌ **Error:** Session not found or already inactive.');
            }
        } catch (error) {
            message.reply(`❌ **Deletion failed:** ${error.message}`);
        }
    }
};
