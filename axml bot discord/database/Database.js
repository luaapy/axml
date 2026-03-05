const fs = require('fs');
const path = require('path');

class Database {
    constructor(dbPath = './data') {
        this.dbPath = dbPath;
        this.collections = new Map();

        this.ensureDirectory();
        this.loadCollections();
    }

    ensureDirectory() {
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
    }

    loadCollections() {
        const collections = ['users', 'guilds', 'projects', 'presets', 'analytics'];

        collections.forEach(collection => {
            const filePath = path.join(this.dbPath, `${collection}.json`);

            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.collections.set(collection, new Map(Object.entries(data)));
            } else {
                this.collections.set(collection, new Map());
                this.saveCollection(collection);
            }
        });
    }

    saveCollection(collection) {
        const data = Object.fromEntries(this.collections.get(collection));
        const filePath = path.join(this.dbPath, `${collection}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    // User operations
    getUser(userId) {
        return this.collections.get('users').get(userId) || this.createUser(userId);
    }

    createUser(userId) {
        const user = {
            id: userId,
            createdAt: Date.now(),
            stats: {
                generationsTotal: 0,
                rendersTotal: 0,
                exportsTotal: 0,
                playtimeSeconds: 0
            },
            preferences: {
                defaultTempo: 120,
                defaultKey: 'C',
                defaultInstrument: 'piano',
                autoVisualize: false
            },
            projects: [],
            favorites: []
        };

        this.collections.get('users').set(userId, user);
        this.saveCollection('users');
        return user;
    }

    updateUser(userId, updates) {
        const user = this.getUser(userId);
        Object.assign(user, updates);
        this.collections.get('users').set(userId, user);
        this.saveCollection('users');
        return user;
    }

    incrementUserStat(userId, stat, amount = 1) {
        const user = this.getUser(userId);
        user.stats[stat] = (user.stats[stat] || 0) + amount;
        this.collections.get('users').set(userId, user);
        this.saveCollection('users');
        return user;
    }

    // Guild operations
    getGuild(guildId) {
        return this.collections.get('guilds').get(guildId) || this.createGuild(guildId);
    }

    createGuild(guildId) {
        const guild = {
            id: guildId,
            joinedAt: Date.now(),
            settings: {
                prefix: '~',
                djRole: null,
                maxSessionsPerUser: 5,
                allowAI: true,
                allowExport: true
            },
            stats: {
                commandsExecuted: 0,
                songsGenerated: 0,
                minutesPlayed: 0
            }
        };

        this.collections.get('guilds').set(guildId, guild);
        this.saveCollection('guilds');
        return guild;
    }

    updateGuild(guildId, updates) {
        const guild = this.getGuild(guildId);
        Object.assign(guild, updates);
        this.collections.get('guilds').set(guildId, guild);
        this.saveCollection('guilds');
        return guild;
    }

    // Project operations
    saveProject(userId, projectData) {
        const projects = this.collections.get('projects');
        const projectId = `${userId}_${Date.now()}`;

        const project = {
            id: projectId,
            userId: userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: projectData.name || 'Untitled Project',
            axml: projectData.axml,
            metadata: projectData.metadata,
            tags: projectData.tags || []
        };

        projects.set(projectId, project);
        this.saveCollection('projects');

        // Add to user's projects
        const user = this.getUser(userId);
        user.projects.push(projectId);
        this.updateUser(userId, user);

        return project;
    }

    getProject(projectId) {
        return this.collections.get('projects').get(projectId);
    }

    getUserProjects(userId) {
        const user = this.getUser(userId);
        return user.projects.map(id => this.getProject(id)).filter(p => p);
    }

    deleteProject(projectId) {
        const project = this.getProject(projectId);
        if (!project) return false;

        // Remove from user's projects
        const user = this.getUser(project.userId);
        user.projects = user.projects.filter(id => id !== projectId);
        this.updateUser(project.userId, user);

        // Delete project
        this.collections.get('projects').delete(projectId);
        this.saveCollection('projects');
        return true;
    }

    // Preset operations
    savePreset(name, presetData) {
        const presets = this.collections.get('presets');
        const presetId = name.toLowerCase().replace(/\s+/g, '_');

        presets.set(presetId, {
            id: presetId,
            name: name,
            data: presetData,
            createdAt: Date.now()
        });

        this.saveCollection('presets');
        return presetId;
    }

    getPreset(presetId) {
        return this.collections.get('presets').get(presetId);
    }

    listPresets() {
        return Array.from(this.collections.get('presets').values());
    }

    // Analytics operations
    logAnalytics(event, data) {
        const analytics = this.collections.get('analytics');
        const key = `${event}_${Date.now()}`;

        analytics.set(key, {
            event: event,
            data: data,
            timestamp: Date.now()
        });

        this.saveCollection('analytics');

        // Keep only last 1000 events
        if (analytics.size > 1000) {
            const entries = Array.from(analytics.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            entries.slice(0, analytics.size - 1000).forEach(([key]) => {
                analytics.delete(key);
            });
            this.saveCollection('analytics');
        }
    }

    getAnalytics(event = null, limit = 100) {
        const analytics = Array.from(this.collections.get('analytics').values());

        let filtered = event ? analytics.filter(a => a.event === event) : analytics;
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        return filtered.slice(0, limit);
    }

    // Utility methods
    backup() {
        const backupDir = path.join(this.dbPath, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupPath = path.join(backupDir, `backup_${timestamp}`);
        fs.mkdirSync(backupPath, { recursive: true });

        this.collections.forEach((data, collection) => {
            const filePath = path.join(backupPath, `${collection}.json`);
            const jsonData = Object.fromEntries(data);
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        });

        return backupPath;
    }

    getStats() {
        return {
            users: this.collections.get('users').size,
            guilds: this.collections.get('guilds').size,
            projects: this.collections.get('projects').size,
            presets: this.collections.get('presets').size,
            analyticsEvents: this.collections.get('analytics').size
        };
    }
}

module.exports = Database;
