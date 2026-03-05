// ============================================
// AXML Studio Pro - Configuration Template
// ============================================
// Copy this file to config.js and fill in your values

module.exports = {
    // API Keys
    groqApiKey: "YOUR_GROQ_API_KEY_HERE", // Get from: https://console.groq.com/
    aiModel: "llama-3.1-8b-instant", // AI model for music generation

    // Discord Bot Configuration
    bot: {
        token: "YOUR_DISCORD_BOT_TOKEN_HERE", // Get from: https://discord.com/developers/applications
        owners: "YOUR_DISCORD_USER_ID_HERE", // Your Discord user ID (can be array for multiple owners)
        prefix: '~', // Command prefix
        version: '4.0.0-ULTIMATE',

        // Status configuration
        status: {
            type: 'PLAYING', // PLAYING, LISTENING, WATCHING, STREAMING
            activities: [
                '~help | Music Production',
                'AI-Powered Composition',
                'AXML Studio Pro'
            ]
        }
    },

    // Theme Colors (Cyberpunk Style)
    theme: {
        primary: '#00FFFF',    // Cyan
        background: '#000000', // True Black
        success: '#00FF00',    // Electric Green
        warning: '#FFA500',    // Amber
        error: '#FF0000',      // Critical Red
        secondary: '#2F4F4F'   // Dark Slate
    },

    // AXML Engine Configuration
    axml: {
        version: '1.0',
        maxTracks: 32,           // Maximum tracks per composition
        maxDuration: 600,        // Maximum duration in seconds (10 minutes)
        maxNotes: 10000,         // Maximum notes per track
        sampleRate: 48000,       // Audio sample rate (Hz)
        bitDepth: 24,            // Audio bit depth
        defaultTempo: 120,       // Default BPM
        defaultKey: 'C',         // Default musical key
        defaultTimeSignature: '4/4'
    },

    // Rate Limits
    limits: {
        maxFileSize: 8388608,          // 8MB in bytes
        maxGenerationsPerMinute: 5,    // AI generations per minute per user
        maxRendersPerMinute: 10,       // File renders per minute per user
        maxExportsPerMinute: 10,       // Exports per minute per user
        maxCollaborators: 10,          // Max users per project
        maxSessionsPerUser: 5,         // Max simultaneous sessions per user
        commandCooldown: 2000          // Cooldown between commands (ms)
    },

    // File Paths
    paths: {
        temp: './temp',
        assets: './assets',
        templates: './assets/templates',
        logs: './logs',
        database: './data',
        backups: './data/backups'
    },

    // Database Configuration
    database: {
        enabled: true,
        autoBackup: true,
        backupInterval: 86400000,  // 24 hours in milliseconds
        maxBackups: 7              // Keep last 7 backups
    },

    // Analytics Configuration
    analytics: {
        enabled: true,
        trackCommands: true,
        trackErrors: true,
        trackGenerations: true,
        maxEvents: 1000            // Maximum events to store
    },

    // Voice Configuration
    voice: {
        maxBitrate: 128000,        // Maximum bitrate for voice (128kbps)
        autoLeaveDelay: 300000,    // Auto-leave after 5 minutes of inactivity
        queueLimit: 50             // Maximum queue size
    },

    // AI Generation Settings
    ai: {
        temperature: 0.7,          // AI creativity (0.0-1.0)
        maxTokens: 2048,           // Maximum response tokens
        timeout: 30000,            // API timeout (ms)
        fallbackEnabled: true,     // Use procedural generation if AI fails
        genres: [
            'synthwave', 'lofi', 'chiptune', 'ambient',
            'jazz', 'classical', 'rock', 'electronic', 'cinematic'
        ]
    },

    // Export Configuration
    export: {
        formats: {
            wav: {
                enabled: true,
                sampleRate: 48000,
                bitDepth: 24
            },
            mp3: {
                enabled: true,
                bitrate: 320        // kbps
            },
            midi: {
                enabled: true,
                ppqn: 480           // Pulses per quarter note
            },
            axml: {
                enabled: true,
                prettyPrint: true
            },
            svg: {
                enabled: true,
                width: 1200,
                height: 600
            }
        }
    },

    // Visualization Settings
    visualization: {
        pianoRoll: {
            width: 1200,
            height: 600,
            noteHeight: 8,
            colors: {
                background: '#000000',
                grid: '#333333',
                notes: '#00FFFF'
            }
        },
        waveform: {
            width: 1200,
            height: 400,
            color: '#00FF00'
        },
        spectrum: {
            width: 1200,
            height: 400,
            bars: 64
        }
    },

    // Maintenance Settings
    maintenance: {
        cleanupInterval: 3600000,   // 1 hour
        maxTempAge: 3600000,        // 1 hour
        healthCheckPort: 3000,
        healthCheckEnabled: true
    },

    // Logging Settings
    logging: {
        level: 'info',              // error, warn, info, debug
        toFile: true,
        toConsole: true,
        maxFileSize: 10485760,      // 10MB
        maxFiles: 5
    },

    // Feature Flags
    features: {
        aiGeneration: true,
        voicePlayback: true,
        exportFormats: true,
        collaboration: false,        // Future feature
        cloudSync: false,            // Future feature
        premiumFeatures: false       // Future feature
    },

    // External Links
    links: {
        documentation: 'https://luaapy.github.io/axml/',
        github: 'https://github.com/luaapy/axml',
        support: 'https://discord.gg/axml',
        website: 'https://axmlstudio.com'
    }
};

// ============================================
// IMPORTANT NOTES:
// ============================================
// 1. Never commit this file with real API keys
// 2. Add config.js to .gitignore
// 3. Get Groq API key from: https://console.groq.com/
// 4. Get Discord bot token from: https://discord.com/developers/applications
// 5. Set appropriate rate limits for your use case
// 6. Adjust paths based on your deployment environment
// ============================================
