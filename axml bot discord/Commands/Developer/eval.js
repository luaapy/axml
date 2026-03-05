module.exports = {
    name: 'eval',
    aliases: ['exec', 'run'],
    description: 'Execute JavaScript code (Bot Owner Only)',
    category: 'admin',
    usage: '~eval [code]',
    examples: ['~eval client.guilds.cache.size'],

    async execute(message, args, client) {
        const owners = Array.isArray(client.config.bot.owners) ?
            client.config.bot.owners : [client.config.bot.owners];

        if (!owners.includes(message.author.id)) {
            return message.reply('❌ This command is restricted to bot owners.');
        }

        if (!args.length) {
            return message.reply('❌ Provide code to evaluate.');
        }

        const code = args.join(' ');

        try {
            let evaled = eval(code);

            if (typeof evaled !== 'string') {
                evaled = require('util').inspect(evaled, { depth: 0 });
            }

            // Truncate if too long
            if (evaled.length > 1900) {
                evaled = evaled.substring(0, 1900) + '...';
            }

            const embed = client.ui.createSuccessEmbed(
                'Evaluation Complete',
                `\`\`\`js\n${evaled}\n\`\`\``,
                []
            );

            await message.reply({ embeds: [embed] });
        } catch (error) {
            const embed = client.ui.createErrorEmbed(
                'ERR_EVAL_001',
                'Evaluation failed',
                [error.message]
            );

            await message.reply({ embeds: [embed] });
        }
    }
};
