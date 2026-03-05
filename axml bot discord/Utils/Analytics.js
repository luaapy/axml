class Analytics {
    constructor(database) {
        this.db = database;
        this.startTime = Date.now();
        this.metrics = {
            commandsExecuted: 0,
            generationsCompleted: 0,
            rendersCompleted: 0,
            exportsCompleted: 0,
            voiceConnectionsCreated: 0,
            errorsOccurred: 0,
            apiCallsGroq: 0
        };
    }

    // Track command execution
    trackCommand(commandName, userId, guildId, success = true) {
        this.metrics.commandsExecuted++;

        this.db.logAnalytics('command', {
            command: commandName,
            userId: userId,
            guildId: guildId,
            success: success
        });

        // Update guild stats
        if (guildId) {
            const guild = this.db.getGuild(guildId);
            guild.stats.commandsExecuted++;
            this.db.updateGuild(guildId, guild);
        }
    }

    // Track AI generation
    trackGeneration(userId, prompt, success, duration) {
        if (success) {
            this.metrics.generationsCompleted++;
            this.db.incrementUserStat(userId, 'generationsTotal');
        }

        this.db.logAnalytics('generation', {
            userId: userId,
            prompt: prompt,
            success: success,
            duration: duration
        });

        this.metrics.apiCallsGroq++;
    }

    // Track render
    trackRender(userId, filename, success, duration) {
        if (success) {
            this.metrics.rendersCompleted++;
            this.db.incrementUserStat(userId, 'rendersTotal');
        }

        this.db.logAnalytics('render', {
            userId: userId,
            filename: filename,
            success: success,
            duration: duration
        });
    }

    // Track export
    trackExport(userId, format, success) {
        if (success) {
            this.metrics.exportsCompleted++;
            this.db.incrementUserStat(userId, 'exportsTotal');
        }

        this.db.logAnalytics('export', {
            userId: userId,
            format: format,
            success: success
        });
    }

    // Track voice connection
    trackVoiceConnection(guildId, duration) {
        this.metrics.voiceConnectionsCreated++;

        this.db.logAnalytics('voice', {
            guildId: guildId,
            duration: duration
        });

        const guild = this.db.getGuild(guildId);
        guild.stats.minutesPlayed += Math.round(duration / 60);
        this.db.updateGuild(guildId, guild);
    }

    // Track error
    trackError(errorCode, errorMessage, context = {}) {
        this.metrics.errorsOccurred++;

        this.db.logAnalytics('error', {
            code: errorCode,
            message: errorMessage,
            context: context
        });
    }

    // Get metrics summary
    getMetrics() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);

        return {
            ...this.metrics,
            uptime: uptime,
            uptimeFormatted: this.formatUptime(uptime),
            database: this.db.getStats()
        };
    }

    // Get popular commands
    getPopularCommands(limit = 10) {
        const commandEvents = this.db.getAnalytics('command', 1000);
        const commandCounts = {};

        commandEvents.forEach(event => {
            const cmd = event.data.command;
            commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
        });

        return Object.entries(commandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([command, count]) => ({ command, count }));
    }

    // Get user activity
    getUserActivity(userId) {
        const allEvents = this.db.getAnalytics(null, 1000);
        const userEvents = allEvents.filter(e => e.data.userId === userId);

        const activity = {
            totalEvents: userEvents.length,
            byType: {},
            recentEvents: userEvents.slice(0, 10)
        };

        userEvents.forEach(event => {
            activity.byType[event.event] = (activity.byType[event.event] || 0) + 1;
        });

        return activity;
    }

    // Get hourly statistics
    getHourlyStats() {
        const allEvents = this.db.getAnalytics(null, 1000);
        const hourlyData = {};

        allEvents.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        });

        return hourlyData;
    }

    // Generate report
    generateReport() {
        const metrics = this.getMetrics();
        const popularCommands = this.getPopularCommands(5);
        const hourlyStats = this.getHourlyStats();

        return {
            generatedAt: Date.now(),
            uptime: metrics.uptimeFormatted,
            metrics: {
                commands: metrics.commandsExecuted,
                generations: metrics.generationsCompleted,
                renders: metrics.rendersCompleted,
                exports: metrics.exportsCompleted,
                voiceConnections: metrics.voiceConnectionsCreated,
                errors: metrics.errorsOccurred,
                groqCalls: metrics.apiCallsGroq
            },
            database: metrics.database,
            popularCommands: popularCommands,
            hourlyActivity: hourlyStats
        };
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    // Export report as JSON
    exportReport(filename = 'analytics_report.json') {
        const fs = require('fs');
        const path = require('path');
        const report = this.generateReport();

        const reportPath = path.join(__dirname, '../data/reports', filename);
        const reportDir = path.dirname(reportPath);

        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        return reportPath;
    }
}

module.exports = Analytics;
