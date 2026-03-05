const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

const CATEGORIES = {
    all: {
        label: 'Command Center',
        emoji: '🎛️',
        color: '#5865F2',
        desc: 'Complete Command Reference'
    },
    creation: {
        label: 'Creative Suite',
        emoji: '🎹',
        color: '#7c3aed',
        desc: 'AI Generation & Composition'
    },
    studio: {
        label: 'Live Studio',
        emoji: '🔊',
        color: '#ec4899',
        desc: 'Playback & Control'
    },
    tools: {
        label: 'Power Tools',
        emoji: '🛠️',
        color: '#f59e0b',
        desc: 'Editing & Processing'
    },
    files: {
        label: 'File Manager',
        emoji: '💾',
        color: '#10b981',
        desc: 'Save & Export'
    },
    info: {
        label: 'Studio Info',
        emoji: '📊',
        color: '#3b82f6',
        desc: 'Stats & Profile'
    },
    games: {
        label: 'Music Games',
        emoji: '🎮',
        color: '#ef4444',
        desc: 'Interactive Challenges'
    }
};

const COMMANDS = {
    creation: [
        { cmd: 'gen', desc: 'AI-powered music generation from text prompts' },
        { cmd: 'template', desc: 'Professional presets and starting points' },
        { cmd: 'render', desc: 'Convert AXML files to audio' }
    ],
    studio: [
        { cmd: 'play', desc: 'Join voice channel and play generated music' },
        { cmd: 'stop', desc: 'Stop playback and leave voice channel' },
        { cmd: 'pause', desc: 'Pause current playback' },
        { cmd: 'resume', desc: 'Resume paused playback' }
    ],
    tools: [
        { cmd: 'visualize', desc: 'Generate piano roll and waveform graphics' },
        { cmd: 'transpose', desc: 'Change pitch and key signature' },
        { cmd: 'tempo', desc: 'Adjust BPM and timing' },
        { cmd: 'analyze', desc: 'Musical structure analysis' }
    ],
    files: [
        { cmd: 'project', desc: 'Save and load cloud projects' },
        { cmd: 'sessions', desc: 'View generation history' },
        { cmd: 'export', desc: 'Export with mastering options' }
    ],
    info: [
        { cmd: 'profile', desc: 'View your studio statistics' },
        { cmd: 'help', desc: 'This help menu' },
        { cmd: 'about', desc: 'About AXML Studio' }
    ],
    games: [
        { cmd: 'quiz', desc: 'Test your music theory knowledge' },
        { cmd: 'guess', desc: 'Identify musical keys and scales' }
    ]
};

module.exports = {
    name: 'help',
    aliases: ['commands', 'guide', 'docs', 'menu', 'h'],
    description: 'Display comprehensive studio reference and documentation',
    category: 'info',
    usage: 'help [category]',
    examples: ['help', 'help creation', 'help tools'],

    async execute(message, args, client) {
        const category = this.validateCategory(args[0]);

        if (category === 'all') {
            await this.sendMainMenu(message, client);
        } else {
            await this.sendCategoryHelp(message, category, client);
        }
    },

    validateCategory(input) {
        const cat = input?.toLowerCase();
        return CATEGORIES[cat] ? cat : 'all';
    },

    async sendMainMenu(message, client) {
        const embed = await this.createMainEmbed(client);
        const menu = this.createCategoryMenu();

        await message.reply({
            embeds: [embed],
            components: [menu]
        });
    },

    async sendCategoryHelp(message, category, client) {
        const embed = await this.createCategoryEmbed(category, client);
        const menu = this.createCategoryMenu();

        await message.reply({
            embeds: [embed],
            components: [menu]
        });
    },

    async createMainEmbed(client) {
        const info = CATEGORIES.all;

        return new EmbedBuilder()
            .setColor(parseInt(info.color.replace('#', '0x')))
            .setTitle('🎛️ **AXML STUDIO**')
            .setDescription(this.buildMainDescription())
            .addFields(this.buildMainFields())
            .setFooter(this.buildFooter(client))
            .setTimestamp();
    },

    buildMainDescription() {
        return [
            '```ansi',
            '\u001b[1;36m╔════════════════════════════════╗',
            '\u001b[1;36m║   \u001b[1;37mAXML STUDIO \u001b[1;36m          ',
            '\u001b[1;36m╚════════════════════════════════╝\u001b[0m',
            '```',
            '',
            '**🎹 CREATIVE SUITE**',
            '> `gen` • `template` • `render`',
            '> *AI-powered music generation*',
            '',
            '**🔊 LIVE STUDIO**',
            '> `play` • `stop` • `pause` • `resume`',
            '> *Real-time playback control*',
            '',
            '**🛠️ POWER TOOLS**',
            '> `visualize` • `transpose` • `tempo`',
            '> *Advanced editing suite*',
            '',
            '**💾 FILE MANAGER**',
            '> `project` • `sessions` • `export`',
            '> *Cloud storage & mastering*',
            '',
            '**📊 STUDIO INFO**',
            '> `profile` • `help` • `about`',
            '> *Stats & documentation*',
            '',
            '**🎮 MUSIC GAMES**',
            '> `quiz` • `guess`',
            '> *Interactive challenges*',
            '',
            '```fix',
            'Start: ~gen [your musical idea]',
            '```'
        ].join('\n');
    },

    buildMainFields() {
        return [];
    },

    async createCategoryEmbed(category, client) {
        // If category is 'all', redirect to main embed
        if (category === 'all') return this.createMainEmbed(client);

        const info = CATEGORIES[category] || CATEGORIES.all;
        const commands = COMMANDS[category] || [];

        const header = [
            '```ansi',
            `\u001b[1;35m┌${'─'.repeat(36)}┐`,
            `\u001b[1;35m│  \u001b[1;37m${info.label.toUpperCase().padEnd(32)}\u001b[1;35m  │`,
            `\u001b[1;35m└${'─'.repeat(36)}┘\u001b[0m`,
            '```',
            `> ${info.emoji} *${info.desc}*`,
            ''
        ].join('\n');

        const commandList = commands.map(cmd => {
            return `### \`~${cmd.cmd}\`\n> ${cmd.desc}`;
        }).join('\n\n');

        const footer = [
            '',
            '```yaml',
            `Total Commands: ${commands.length}`,
            '```'
        ].join('\n');

        return new EmbedBuilder()
            .setColor(parseInt(info.color.replace('#', '0x')))
            .setTitle(`${info.emoji} ${info.label}`)
            .setDescription(`${header}${commandList}${footer}`)
            .setFooter(this.buildFooter(client))
            .setTimestamp();
    },

    buildFooter(client) {
        return {
            text: `${client.commands.size} Commands | Select a category below`,
            iconURL: client.user.displayAvatarURL()
        };
    },

    createCategoryMenu() {
        const options = Object.keys(CATEGORIES)
            // .filter(key => key !== 'all') // Optional: Keep 'all' or remove. Removing 'all' from dropdown makes sense if 'all' is the default view, but users might want to go back to Home.
            // Let's keep 'all' as "Home"
            .map(key => ({
                label: CATEGORIES[key].label,
                value: key,
                description: CATEGORIES[key].desc,
                emoji: CATEGORIES[key].emoji
            }));

        const menu = new StringSelectMenuBuilder()
            .setCustomId('help_menu_select') // Unified ID
            .setPlaceholder('📖 Browse Command Categories...')
            .addOptions(options);

        return new ActionRowBuilder().addComponents(menu);
    }
};