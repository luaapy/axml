module.exports = {
    name: 'clientReady',
    once: true,

    async execute(client) {
        console.log(`✅ Bot is online as ${client.user.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
        console.log(`👥 Total users: ${client.users.cache.size}`);
        console.log(`⚡ Commands loaded: ${client.commands.size}`);

        // Set initial presence
        client.user.setPresence({
            status: 'online',
            activities: [{
                name: `~help | ${client.guilds.cache.size} servers`,
                type: 0 // PLAYING
            }]
        });

        // Rotate activities every 5 minutes
        setInterval(() => {
            const activities = [
                { name: `~help | ${client.guilds.cache.size} servers`, type: 0 },
                { name: `🎹 AXML Music Production`, type: 0 },
                { name: `~gen to create music`, type: 2 }, // LISTENING
                { name: `${client.sessions.activeSessions.size} active sessions`, type: 3 }, // WATCHING
                { name: `AI-Powered Music | ~help`, type: 0 }
            ];

            const activity = activities[Math.floor(Math.random() * activities.length)];
            client.user.setActivity(activity.name, { type: activity.type });
        }, 300000); // 5 minutes

        // Cleanup old temp files on startup
        setTimeout(() => {
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(__dirname, '../temp');

            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                const oneHourAgo = Date.now() - (60 * 60 * 1000);

                let cleaned = 0;
                files.forEach(file => {
                    const filePath = path.join(tempDir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.mtimeMs < oneHourAgo) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                    }
                });

                if (cleaned > 0) {
                    console.log(`🧹 Cleaned ${cleaned} old temp files`);
                }
            }
        }, 5000);

        console.log('━'.repeat(60));
        console.log('🎹 AXML Studio Pro is ready!');
        console.log('━'.repeat(60));
    }
};
