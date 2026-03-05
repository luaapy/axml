const { Client, Collection, GatewayIntentBits, Partials, ActivityType, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generateDependencyReport } = require('@discordjs/voice');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { EventEmitter } = require('events');
const libsodium = require('libsodium-wrappers');

const config = require('./config');
const AXMLEngine = require('./structures/AXMLEngine');
const UIComponents = require('./structures/UIComponents');
const AIGenerator = require('./structures/AIGenerator');
const AudioSynthesizer = require('./structures/AudioSynthesizer');
const Database = require('./database/Database');

const { createCanvas } = require('@napi-rs/canvas');

// Placeholder for SVG logic until fully implemented
class SVGExporter {
    constructor(cfg) { this.config = cfg; }
    generatePianoRoll() { return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>'; }
    async svgToPng() {
        const canvas = createCanvas(100, 100);
        return canvas.toBuffer('image/png');
    }
    async getIconPng() {
        const canvas = createCanvas(64, 64);
        return canvas.toBuffer('image/png');
    }
}

class AXMLStudioLogger {
    constructor() {
        this.logDir = './logs';
        this.currentLogFile = null;
        this.logQueue = [];
        this.maxQueueSize = 100;
        this.flushInterval = 5000;

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        this.initializeLogFile();
        this.startPeriodicFlush();
    }

    initializeLogFile() {
        const today = new Date().toISOString().split('T')[0];
        this.currentLogFile = path.join(this.logDir, `axml-${today}.log`);

        if (!fs.existsSync(this.currentLogFile)) {
            const header = `=== AXML Studio Pro Log - ${today} ===\n`;
            fs.writeFileSync(this.currentLogFile, header);
        }
    }

    format(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
        return `[${timestamp}] [${level.toUpperCase().padEnd(8)}] ${message}${metaStr}`;
    }

    writeToFile(level, message, metadata) {
        const formatted = this.format(level, message, metadata);
        this.logQueue.push(formatted);

        if (this.logQueue.length >= this.maxQueueSize) {
            this.flush();
        }
    }

    flush() {
        if (this.logQueue.length === 0) return;

        const content = this.logQueue.join('\n') + '\n';
        this.logQueue = [];

        try {
            fs.appendFileSync(this.currentLogFile, content);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    startPeriodicFlush() {
        setInterval(() => this.flush(), this.flushInterval);
    }

    info(msg, meta = {}) {
        console.log(`[\x1b[36mINFO\x1b[0m] ${msg}`);
        this.writeToFile('info', msg, meta);
    }

    success(msg, meta = {}) {
        console.log(`[\x1b[32mSUCCESS\x1b[0m] ${msg}`);
        this.writeToFile('success', msg, meta);
    }

    warn(msg, meta = {}) {
        console.log(`[\x1b[33mWARN\x1b[0m] ${msg}`);
        this.writeToFile('warn', msg, meta);
    }

    error(msg, meta = {}) {
        console.error(`[\x1b[31mERROR\x1b[0m] ${msg}`);
        this.writeToFile('error', msg, meta);
    }

    system(msg, meta = {}) {
        console.log(`[\x1b[35mSYSTEM\x1b[0m] ${msg}`);
        this.writeToFile('system', msg, meta);
    }

    debug(msg, meta = {}) {
        if (config.system?.debug) {
            console.log(`[\x1b[90mDEBUG\x1b[0m] ${msg}`);
            this.writeToFile('debug', msg, meta);
        }
    }
}

const logger = new AXMLStudioLogger();

class SessionManager extends EventEmitter {
    constructor() {
        super();
        this.activeSessions = new Map();
        this.lastAccessed = new Map();
        this.sessionTimeout = 3600000;
        this.maxSessionsPerUser = 5;

        this.startCleanupTask();
    }

    createSession(userId, projectData) {
        const userSessions = Array.from(this.activeSessions.entries())
            .filter(([id, data]) => data.userId === userId);

        if (userSessions.length >= this.maxSessionsPerUser) {
            const oldestSession = userSessions.sort((a, b) =>
                this.lastAccessed.get(a[0]) - this.lastAccessed.get(b[0])
            )[0];
            this.endSession(oldestSession[0]);
        }

        const sessionId = Buffer.from(`${userId}-${Date.now()}-${Math.random()}`).toString('base64');
        const sessionData = {
            ...projectData,
            userId,
            createdAt: Date.now(),
            lastModified: Date.now()
        };

        this.activeSessions.set(sessionId, sessionData);
        this.lastAccessed.set(sessionId, Date.now());

        this.emit('sessionCreated', { sessionId, userId });
        logger.info(`Session created for user ${userId}`, { sessionId });

        return sessionId;
    }

    getSession(sessionId) {
        if (!this.activeSessions.has(sessionId)) {
            logger.warn(`Session ${sessionId} not found`);
            return null;
        }

        this.lastAccessed.set(sessionId, Date.now());
        return this.activeSessions.get(sessionId);
    }

    updateSession(sessionId, newData) {
        if (!this.activeSessions.has(sessionId)) {
            logger.error(`Cannot update non-existent session ${sessionId}`);
            return false;
        }

        const currentData = this.activeSessions.get(sessionId);
        const updatedData = {
            ...currentData,
            ...newData,
            lastModified: Date.now()
        };

        this.activeSessions.set(sessionId, updatedData);
        this.lastAccessed.set(sessionId, Date.now());

        this.emit('sessionUpdated', { sessionId, data: updatedData });
        return true;
    }

    endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);

        this.activeSessions.delete(sessionId);
        this.lastAccessed.delete(sessionId);

        if (session) {
            this.emit('sessionEnded', { sessionId, userId: session.userId });
            logger.info(`Session ended`, { sessionId, userId: session.userId });
        }
    }

    getUserSessions(userId) {
        return Array.from(this.activeSessions.entries())
            .filter(([id, data]) => data.userId === userId)
            .map(([id, data]) => ({ sessionId: id, ...data }));
    }

    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [id, time] of this.lastAccessed.entries()) {
            if (now - time > this.sessionTimeout) {
                this.endSession(id);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`Session cleanup: removed ${cleaned} expired sessions`);
        }
    }

    startCleanupTask() {
        setInterval(() => this.cleanup(), 600000);
    }

    getStats() {
        return {
            activeSessions: this.activeSessions.size,
            oldestSession: Math.min(...Array.from(this.lastAccessed.values())),
            newestSession: Math.max(...Array.from(this.lastAccessed.values()))
        };
    }
}

class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.globalLimits = new Map();
        this.cleanupInterval = 120000;

        this.startCleanup();
    }

    isLimited(userId, action, limit = config.limits?.maxGenerationsPerMinute || 5, window = 60000) {
        const key = `${userId}-${action}`;
        const now = Date.now();

        if (!this.limits.has(key)) {
            this.limits.set(key, [now]);
            return false;
        }

        const history = this.limits.get(key).filter(timestamp => now - timestamp < window);

        if (history.length >= limit) {
            logger.warn(`Rate limit exceeded for user ${userId} on action ${action}`);
            return true;
        }

        history.push(now);
        this.limits.set(key, history);
        return false;
    }

    isGlobalLimited(action, limit = 100, window = 60000) {
        const now = Date.now();

        if (!this.globalLimits.has(action)) {
            this.globalLimits.set(action, [now]);
            return false;
        }

        const history = this.globalLimits.get(action).filter(t => now - t < window);

        if (history.length >= limit) {
            logger.error(`Global rate limit exceeded for action ${action}`);
            return true;
        }

        history.push(now);
        this.globalLimits.set(action, history);
        return false;
    }

    getRemainingCalls(userId, action, limit = 5, window = 60000) {
        const key = `${userId}-${action}`;
        const now = Date.now();

        if (!this.limits.has(key)) return limit;

        const history = this.limits.get(key).filter(t => now - t < window);
        return Math.max(0, limit - history.length);
    }

    reset(userId, action = null) {
        if (action) {
            this.limits.delete(`${userId}-${action}`);
        } else {
            const keys = Array.from(this.limits.keys()).filter(k => k.startsWith(`${userId}-`));
            keys.forEach(k => this.limits.delete(k));
        }
    }

    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            const oldWindow = 300000;

            for (const [key, history] of this.limits.entries()) {
                const filtered = history.filter(t => now - t < oldWindow);
                if (filtered.length === 0) {
                    this.limits.delete(key);
                } else {
                    this.limits.set(key, filtered);
                }
            }
        }, this.cleanupInterval);
    }
}

class ProjectExporter {
    constructor(client) {
        this.client = client;
        this.exportQueue = [];
        this.processing = false;
    }

    async toWav(axmlData, options = {}) {
        logger.info(`Exporting project "${axmlData.meta?.title}" to WAV format`);

        const sampleRate = options.sampleRate || config.axml?.sampleRate || 48000;
        const bitDepth = options.bitDepth || config.axml?.bitDepth || 24;

        logger.debug('WAV export parameters', { sampleRate, bitDepth });

        const dummyBuffer = Buffer.alloc(1024);
        return dummyBuffer;
    }

    async toMp3(axmlData, options = {}) {
        logger.info(`Exporting project "${axmlData.meta?.title}" to MP3 format`);

        const bitrate = options.bitrate || 320;
        logger.debug('MP3 export parameters', { bitrate });

        const dummyBuffer = Buffer.alloc(512);
        return dummyBuffer;
    }

    async toMidi(axmlData) {
        logger.info(`Converting AXML to MIDI format`);

        const midiData = {
            format: 1,
            tracks: axmlData.tracks?.length || 0,
            ticksPerBeat: 480
        };

        logger.debug('MIDI conversion data', midiData);

        const dummyBuffer = Buffer.alloc(256);
        return dummyBuffer;
    }

    async toAxml(axmlData) {
        logger.info(`Exporting to AXML format`);

        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
        const axmlContent = this.buildAXMLString(axmlData);

        return xmlHeader + axmlContent;
    }

    buildAXMLString(data) {
        let xml = '<axml version="1.0">\n';

        xml += '  <metadata>\n';
        xml += `    <title>${this.escapeXml(data.meta?.title || 'Untitled')}</title>\n`;
        xml += `    <artist>${this.escapeXml(data.meta?.artist || 'Unknown')}</artist>\n`;
        xml += `    <tempo>${data.meta?.tempo || 120}</tempo>\n`;
        xml += `    <time-signature>${data.meta?.timeSignature || '4/4'}</time-signature>\n`;
        xml += `    <key>${data.meta?.key || 'C'}</key>\n`;
        xml += '  </metadata>\n';

        xml += '  <instruments>\n';
        if (data.instruments) {
            data.instruments.forEach(inst => {
                xml += `    <instrument id="${inst.id}" type="${inst.type}" volume="${inst.volume}"`;
                if (inst.pan !== 0) xml += ` pan="${inst.pan}"`;
                if (inst.attack) xml += ` attack="${inst.attack}"`;
                if (inst.release) xml += ` release="${inst.release}"`;
                xml += '/>\n';
            });
        }
        xml += '  </instruments>\n';

        xml += '  <tracks>\n';
        if (data.tracks) {
            data.tracks.forEach(track => {
                xml += `    <track instrument="${track.instrument}" name="${this.escapeXml(track.name)}">\n`;
                if (track.notes) {
                    track.notes.forEach(note => {
                        xml += `      <note pitch="${note.pitch}" duration="${note.duration}" velocity="${note.velocity}"/>\n`;
                    });
                }
                xml += '    </track>\n';
            });
        }
        xml += '  </tracks>\n';

        xml += '</axml>';
        return xml;
    }

    escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    queueExport(task) {
        this.exportQueue.push(task);
        if (!this.processing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.exportQueue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const task = this.exportQueue.shift();

        try {
            await task();
        } catch (error) {
            logger.error(`Export task failed: ${error.message}`);
        }

        setTimeout(() => this.processQueue(), 100);
    }
}

class MaintenanceManager {
    constructor(client) {
        this.client = client;
        this.tasks = [];
        this.lastCleanup = Date.now();
        this.lastHealthCheck = Date.now();
    }

    init() {
        this.registerTask('cleanup', this.runCleanup.bind(this), 600000);
        this.registerTask('health', this.monitorHealth.bind(this), 300000);
        this.registerTask('sessions', () => this.client.sessions.cleanup(), 600000);
        this.registerTask('metrics', this.collectMetrics.bind(this), 900000);

        logger.success('Maintenance manager initialized with 4 tasks');
    }

    registerTask(name, fn, interval) {
        const task = {
            name,
            fn,
            interval,
            lastRun: 0
        };

        this.tasks.push(task);

        setInterval(async () => {
            try {
                await fn();
                task.lastRun = Date.now();
            } catch (error) {
                logger.error(`Maintenance task "${name}" failed: ${error.message}`);
            }
        }, interval);
    }

    async runCleanup() {
        logger.info('Starting file cleanup task');

        const tempPath = config.paths?.temp || './temp';
        if (!fs.existsSync(tempPath)) return;

        const files = fs.readdirSync(tempPath);
        const now = Date.now();
        const maxAge = 3600000;
        let cleaned = 0;

        files.forEach(file => {
            const filePath = path.join(tempPath, file);

            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            } catch (error) {
                logger.warn(`Failed to clean file ${file}: ${error.message}`);
            }
        });

        if (cleaned > 0) {
            logger.info(`Cleanup completed: ${cleaned} files removed`);
        }

        this.lastCleanup = Date.now();
    }

    async monitorHealth() {
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
        const uptime = process.uptime();

        logger.system(`Health Check | Memory: ${heapUsedMB}MB / ${heapTotalMB}MB | Uptime: ${this.formatUptime(uptime)}`);

        if (mem.heapUsed > 768 * 1024 * 1024) {
            logger.warn('High memory usage detected - consider restarting');
        }

        if (global.gc && mem.heapUsed > 512 * 1024 * 1024) {
            logger.info('Running garbage collection');
            global.gc();
        }

        this.lastHealthCheck = Date.now();
    }

    async collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            sessions: this.client.sessions.getStats(),
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            commands: this.client.commands.size
        };

        logger.debug('Metrics collected', metrics);
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    getTaskStatus() {
        return this.tasks.map(task => ({
            name: task.name,
            lastRun: task.lastRun,
            interval: task.interval
        }));
    }
}

class ErrorTracker {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
    }

    report(error, context = {}) {
        const errorId = this.generateId();
        const errorReport = {
            id: errorId,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now()
        };

        this.errors.push(errorReport);

        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        logger.error(`[ID:${errorId}] ${error.message}`, context);

        return errorId;
    }

    generateId() {
        return Math.random().toString(36).substring(2, 9).toUpperCase();
    }

    getError(id) {
        return this.errors.find(e => e.id === id);
    }

    getRecentErrors(count = 10) {
        return this.errors.slice(-count).reverse();
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.User, Partials.Reaction],
    presence: {
        status: 'online',
        activities: [{
            name: 'AXML Studio Pro | !help',
            type: ActivityType.Playing
        }]
    }
});

client.commands = new Collection();
client.buttons = new Collection();
client.menus = new Collection();
client.modals = new Collection();
client.sessions = new SessionManager();
client.rateLimiter = new RateLimiter();
client.exporter = new ProjectExporter(client);
client.maintenance = new MaintenanceManager(client);
client.errorTracker = new ErrorTracker();
client.config = config;
client.axml = new AXMLEngine(config);
client.ai = new AIGenerator(config);
client.audio = new AudioSynthesizer(config);
client.ui = new UIComponents(config);
client.db = new Database(path.join(__dirname, 'data'));
client.svg = new SVGExporter(config);
client.renderQueue = [];
client.logger = logger;


function ensureDirectoryStructure() {
    const directories = [
        './temp',
        './logs',
        './assets',
        './assets/svg',
        './assets/templates',
        './assets/fonts',
        './commands',
        './commands/music',
        './commands/axml',
        './commands/effects',
        './commands/tools',
        './commands/admin',
        './events'
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logger.info(`Created directory: ${dir}`);
        }
    });
}

function loadCommands() {
    const commandFolders = ['Music', 'Axml', 'effects', 'Tools', 'admin', 'Developer'];
    let totalCommands = 0;

    commandFolders.forEach(folder => {
        const folderPath = path.join(__dirname, 'Commands', folder);

        if (!fs.existsSync(folderPath)) {
            logger.warn(`Command folder not found: ${folder}`);
            return;
        }

        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

        files.forEach(file => {
            try {
                const command = require(path.join(folderPath, file));

                if (command.name) {
                    client.commands.set(command.name, command);
                    totalCommands++;
                    logger.debug(`Loaded command: ${command.name}`, { category: folder });
                }
            } catch (error) {
                logger.error(`Failed to load command ${folder}/${file}: ${error.message}`);
            }
        });
    });

    logger.success(`Commands loaded: ${totalCommands} total`);
    return totalCommands;
}

function loadEvents() {
    const eventsPath = path.join(__dirname, 'Events');

    if (!fs.existsSync(eventsPath)) {
        logger.warn('Events directory not found');
        return 0;
    }

    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    let totalEvents = 0;

    files.forEach(file => {
        try {
            const event = require(path.join(eventsPath, file));

            if (event.name) {
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }

                totalEvents++;
                logger.debug(`Loaded event: ${event.name}`);
            }
        } catch (error) {
            logger.error(`Failed to load event ${file}: ${error.message}`);
        }
    });

    logger.success(`Events loaded: ${totalEvents} total`);
    return totalEvents;
}

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    res.json({
        status: 'online',
        version: config.bot?.version || '4.0.0',
        uptime: uptime,
        uptimeFormatted: formatUptime(uptime),
        memory: {
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
            rss: Math.round(memory.rss / 1024 / 1024)
        },
        sessions: client.sessions.activeSessions.size,
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        commands: client.commands.size
    });
});

app.get('/metrics', (req, res) => {
    res.json({
        sessions: client.sessions.getStats(),
        errors: client.errorTracker.getRecentErrors(5),
        maintenance: client.maintenance.getTaskStatus()
    });
});

app.post('/webhook/shutdown', (req, res) => {
    const authKey = req.headers['x-auth-key'];

    if (authKey !== process.env.WEBHOOK_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.warn('Shutdown webhook triggered');
    res.json({ status: 'Shutting down...' });

    setTimeout(() => {
        client.destroy();
        process.exit(0);
    }, 5000);
});

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

// Redundant listeners removed. Handled in Events folder.

// Redundant messageCreate listener removed. Handled in Events/MessageCreate.js

// Redundant interactionCreate listener removed. Handled in Events/InteractionCreate.js

client.on('error', error => {
    logger.error(`Discord client error: ${error.message}`);
});

client.on('warn', warning => {
    logger.warn(`Discord client warning: ${warning}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Promise Rejection: ${reason}`);
    client.errorTracker.report(new Error(String(reason)), { type: 'unhandledRejection' });
});

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    logger.error(error.stack);

    logger.flush();

    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

process.on('SIGINT', () => {
    logger.warn('SIGINT received - initiating graceful shutdown');

    logger.flush();
    client.destroy();

    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

process.on('SIGTERM', () => {
    logger.warn('SIGTERM received - initiating graceful shutdown');

    logger.flush();
    client.destroy();

    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

(async () => {
    logger.system('='.repeat(60));
    logger.system('AXML Studio Pro - Enhanced Edition');
    logger.system(`Version: ${config.bot?.version || '4.0.0-ENHANCED'}`);
    logger.system('Initializing bot systems...');
    logger.system('='.repeat(60));

    try {
        ensureDirectoryStructure();

        // Wait for libsodium to be ready for voice encryption
        await libsodium.ready;
        logger.success('Libsodium encryption engine initialized');

        const commandCount = loadCommands();
        const eventCount = loadEvents();

        logger.info(`Loaded ${commandCount} commands and ${eventCount} events`);

        app.listen(3000, () => {
            logger.success('Health check API running on port 3000');
            logger.info('Endpoints: /health, /metrics');
        });

        await client.login(config.bot?.token || process.env.BOT_TOKEN);

        client.maintenance.init();

        logger.success('Bot initialization complete');
        logger.info(`Process ID: ${process.pid}`);

    } catch (error) {
        logger.error(`Fatal error during initialization: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    }
})();

module.exports = client;