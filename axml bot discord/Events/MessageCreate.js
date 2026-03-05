const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    once: false,

    async execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Auto-reply to mentions
        if (message.mentions.has(client.user) && !message.content.startsWith(client.config.bot.prefix)) {
            const embed = client.ui.createSuccessEmbed(
                '👋 Hello!',
                `I'm **AXML Studio Pro**, an AI-powered music production bot!`,
                [
                    { name: 'Get Started', value: '`~help` - View all commands', inline: false },
                    { name: 'Generate Music', value: '`~gen [prompt]` - AI music generation', inline: false },
                    { name: 'Templates', value: '`~template` - Browse pre-made tracks', inline: false }
                ]
            );
            return message.reply({ embeds: [embed] });
        }

        // Auto-react to AXML file uploads
        if (message.attachments.size > 0) {
            const axmlFile = message.attachments.find(att => att.name.endsWith('.axml'));
            if (axmlFile) {
                await message.react('🎵');
                if (!message.content.includes('~render')) {
                    const hint = await message.reply('💡 **Tip**: Use `~render` to play this AXML file!');
                    setTimeout(() => hint.delete().catch(() => { }), 10000);
                }
            }
        }

        // --- Command Handling ---
        const prefix = client.config.bot?.prefix || '!';

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        // Rate Limiting
        if (client.rateLimiter && client.rateLimiter.isLimited(message.author.id, commandName)) {
            return message.reply('⏱️ **Rate Limit** You are doing that too fast. Please wait a moment.');
        }

        try {
            const logDetails = `CMD: \x1b[36m${commandName}\x1b[0m | User: \x1b[33m${message.author.tag}\x1b[0m | Guild: \x1b[35m${message.guild?.name || 'DM'}\x1b[0m`;

            if (client.logger) {
                client.logger.info(logDetails, {
                    command: commandName,
                    userId: message.author.id,
                    guildId: message.guild?.id
                });
            } else {
                console.log(`[INFO] ${logDetails}`);
            }

            await command.execute(message, args, client);

        } catch (error) {
            console.error(`Error executing ${commandName}:`, error);

            if (client.errorTracker) {
                const errorId = client.errorTracker.report(error, {
                    command: commandName,
                    user: message.author.id,
                    guild: message.guild?.id
                });

                const errorEmbed = client.ui.createErrorEmbed(
                    'ERR_CMD_EXEC',
                    `An error occurred while executing this command.\n\`\`\`${error.message}\`\`\``,
                    [`Error ID: ${errorId}`]
                );

                message.reply({ embeds: [errorEmbed] }).catch(() => { });
            } else {
                message.reply('❌ An error occurred while executing this command.').catch(() => { });
            }
        }
    }
};
