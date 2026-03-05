module.exports = {
    name: 'sessions',
    aliases: ['session', 'list', 'mysessions'],
    description: 'View and manage your active sessions',
    category: 'tools',
    usage: '~sessions [action] [session_id]',
    examples: ['~sessions', '~sessions list', '~sessions delete [id]'],

    async execute(message, args, client) {
        const action = args[0]?.toLowerCase() || 'list';
        const userSessions = client.sessions.getUserSessions(message.author.id);

        switch (action) {
            case 'list':
            case 'view':
            case 'show':
                await showSessions(message, client, userSessions);
                break;

            case 'delete':
            case 'remove':
            case 'clear':
                if (args[1]) {
                    await deleteSession(message, client, args[1]);
                } else {
                    await deleteAllSessions(message, client, userSessions);
                }
                break;

            case 'info':
            case 'details':
                if (args[1]) {
                    await showSessionInfo(message, client, args[1]);
                } else {
                    const embed = client.ui.createErrorEmbed(
                        'ERR_INPUT_010',
                        'No session ID provided',
                        ['Use: ~sessions info [session_id]']
                    );
                    message.reply({ embeds: [embed] });
                }
                break;

            default:
                await showSessions(message, client, userSessions);
        }
    }
};

async function showSessions(message, client, sessions) {
    if (sessions.length === 0) {
        const embed = client.ui.createErrorEmbed(
            'ERR_SESSION_002',
            'No active sessions',
            ['Create a session with ~gen', 'Or upload an AXML file with ~render']
        );
        return message.reply({ embeds: [embed] });
    }

    const embed = client.ui.createSessionsEmbed(sessions);
    const attachments = await client.ui.getCommonIconAttachments(client, ['logo.svg']);
    await message.reply({ embeds: [embed], files: attachments });
}

async function deleteSession(message, client, sessionId) {
    try {
        client.sessions.endSession(sessionId);

        const embed = client.ui.createSuccessEmbed(
            'Session Deleted',
            `Session \`${sessionId}\` has been removed.`,
            []
        );
        const attachments = await client.ui.getCommonIconAttachments(client, ['logo.svg']);
        await message.reply({ embeds: [embed], files: attachments });
    } catch (error) {
        const embed = client.ui.createErrorEmbed(
            'ERR_SESSION_003',
            'Failed to delete session',
            [`Session ID might be invalid: ${sessionId}`]
        );
        await message.reply({ embeds: [embed] });
    }
}

async function deleteAllSessions(message, client, sessions) {
    if (sessions.length === 0) {
        const embed = client.ui.createErrorEmbed(
            'ERR_SESSION_002',
            'No sessions to delete',
            []
        );
        return message.reply({ embeds: [embed] });
    }

    sessions.forEach(session => {
        client.sessions.endSession(session.sessionId);
    });

    const embed = client.ui.createSuccessEmbed(
        'All Sessions Cleared',
        `Deleted ${sessions.length} session(s)`,
        []
    );
    const attachments = await client.ui.getCommonIconAttachments(client, ['logo.svg']);
    await message.reply({ embeds: [embed], files: attachments });
}

async function showSessionInfo(message, client, sessionId) {
    const session = client.sessions.getSession(sessionId);

    if (!session) {
        const embed = client.ui.createErrorEmbed(
            'ERR_SESSION_004',
            'Session not found',
            [`Invalid session ID: ${sessionId}`]
        );
        return message.reply({ embeds: [embed] });
    }

    const created = new Date(session.createdAt);
    const modified = new Date(session.lastModified);
    const age = Math.floor((Date.now() - session.createdAt) / 1000 / 60);

    const metadata = session.parsed?.metadata || {};
    const tracks = session.parsed?.tracks || [];
    const instruments = session.parsed?.instruments || [];

    const trackList = tracks.slice(0, 5).map((track, i) =>
        `${i + 1}. ${track.name} (${track.notes?.length || 0} notes)`
    ).join('\n') + (tracks.length > 5 ? `\n...and ${tracks.length - 5} more` : '');

    const embed = client.ui.createSuccessEmbed(
        `📊 Session Details`,
        `**${metadata.title || 'Untitled'}** by ${metadata.artist || 'Unknown'}`,
        [
            { name: '🎵 Tempo', value: `${metadata.tempo || 120} BPM`, inline: true },
            { name: '🎹 Key', value: metadata.key || 'N/A', inline: true },
            { name: '⏱️ Time Signature', value: metadata.timeSignature || '4/4', inline: true },
            { name: '🎼 Genre', value: metadata.genre || 'N/A', inline: true },
            { name: '📊 Tracks', value: tracks.length.toString(), inline: true },
            { name: '🎸 Instruments', value: instruments.length.toString(), inline: true },
            { name: '📅 Created', value: `${age}m ago`, inline: true },
            { name: '🔄 Modified', value: new Date(modified).toLocaleTimeString(), inline: true },
            { name: '🆔 Session ID', value: `\`${sessionId}\``, inline: false },
            { name: '🎵 Tracks', value: trackList || 'No tracks', inline: false }
        ]
    );

    if (session.prompt) {
        embed.addFields({ name: '💭 Original Prompt', value: session.prompt, inline: false });
    }

    const attachments = await client.ui.getCommonIconAttachments(client, ['logo.svg']);
    await message.reply({ embeds: [embed], files: attachments });
}
