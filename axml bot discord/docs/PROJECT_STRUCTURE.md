# 🗂️ AXML Studio Pro - Project Structure

## Directory Tree

```
d:/Axml bot discord/
│
├── 📁 commands/              # Bot command modules
│   ├── 📁 axml/             # AXML-specific commands
│   │   ├── gen.js           # AI music generation
│   │   └── render.js        # AXML file rendering
│   │
│   ├── 📁 admin/            # Admin commands (owner only)
│   │   ├── cleanup.js       # File/session cleanup
│   │   └── eval.js          # Code evaluation
│   │
│   ├── 📁 effects/          # Audio effects commands
│   │   ├── transpose.js     # Key transposition
│   │   └── tempo.js         # BPM modification
│   │
│   ├── 📁 music/            # Music playback commands
│   │   ├── play.js          # Voice channel playback
│   │   └── stop.js          # Stop & disconnect
│   │
│   └── 📁 tools/            # Utility commands
│       ├── export.js        # Multi-format export
│       ├── help.js          # Command reference
│       ├── sessions.js      # Session management
│       ├── stats.js         # Bot statistics
│       ├── template.js      # Template browser
│       └── visualize.js     # Visualization generator
│
├── 📁 events/               # Discord.js event handlers
│   ├── interactionCreate.js # Button/menu/modal handler
│   └── ready.js             # Bot initialization
│
├── 📁 structures/           # Core engine modules
│   ├── AXMLEngine.js        # XML parsing & validation
│   ├── SVGGenerator.js      # Visual generation
│   ├── AIGenerator.js       # Groq API integration
│   ├── AudioSynthesizer.js  # WAV synthesis engine
│   └── UIComponents.js      # Discord UI elements
│
├── 📁 utils/                # Utility modules
│   ├── FileManager.js       # File operations
│   └── AXMLValidator.js     # AXML validation logic
│
├── 📁 assets/               # Static assets
│   ├── 📁 templates/        # Pre-made AXML files
│   │   ├── synthwave-example.axml
│   │   ├── lofi-example.axml
│   │   └── chiptune-example.axml
│   │
│   ├── 📁 fonts/            # Custom fonts (empty)
│   └── 📁 images/           # Images & icons (empty)
│
├── 📁 temp/                 # Temporary file storage
│   └── (auto-generated .wav, .svg, .axml files)
│
├── 📁 logs/                 # Application logs
│   └── (auto-generated log files)
│
├── 📁 docs/                 # Documentation
│   └── AXML_REFERENCE.md    # AXML standard guide
│
├── 📁 scripts/              # Utility scripts
│   └── (future deployment scripts)
│
├── 📄 index.js              # Main bot entry point
├── 📄 config.js             # Bot configuration
├── 📄 Setting.js            # Alternative config
├── 📄 package.json          # Dependencies & scripts
├── 📄 README.md             # Project documentation
├── 📄 start.bat             # Windows startup script
└── 📄 .gitignore            # Git ignore rules

```

---

## File Breakdown

### **Core System Files**

| File | Purpose | Key Features |
|------|---------|--------------|
| `index.js` | Main entry point | Client initialization, command/event loading, Express server |
| `config.js` | Configuration | API keys, bot token, theme, limits, paths |
| `package.json` | Dependencies | NPM packages, scripts, metadata |

### **Commands (14 total)**

#### **AXML Category (2)**
- `gen.js` - AI music generation with Groq API
- `render.js` - AXML file parsing and rendering

#### **Admin Category (2)**
- `cleanup.js` - Cleanup old files and sessions
- `eval.js` - Execute JavaScript code (owner only)

#### **Effects Category (2)**
- `transpose.js` - Transpose key by semitones
- `tempo.js` - Change BPM/tempo

#### **Music Category (2)**
- `play.js` - Play in voice channel
- `stop.js` - Stop playback & disconnect

#### **Tools Category (6)**
- `export.js` - Multi-format export (WAV, MP3, MIDI, SVG, AXML)
- `help.js` - Command reference & documentation
- `sessions.js` - Session management (list, delete, info)
- `stats.js` - Bot statistics display
- `template.js` - Template browser & loader
- `visualize.js` - Visualization generator

### **Events (2)**

| Event | Purpose |
|-------|---------|
| `ready.js` | Bot startup, presence rotation, cleanup |
| `interactionCreate.js` | Handle buttons, menus, modals |

### **Structures (5 Core Modules)**

| Module | Lines | Purpose |
|--------|-------|---------|
| `AXMLEngine.js` | ~400 | XML parsing, validation, auto-correction |
| `SVGGenerator.js` | ~200 | Piano roll, waveform, spectrum, notation |
| `AIGenerator.js` | ~350 | Groq API, genre templates, fallback generation |
| `AudioSynthesizer.js` | ~250 | WAV synthesis, oscillators, ADSR |
| `UIComponents.js` | ~500 | Embeds, buttons, menus, modals |

### **Utilities (2)**

| Utility | Purpose |
|---------|---------|
| `FileManager.js` | File operations, cleanup, size tracking |
| `AXMLValidator.js` | Metadata/instrument/note validation |

### **Templates (3)**

| Template | Genre | Tempo | Description |
|----------|-------|-------|-------------|
| `synthwave-example.axml` | Synthwave | 128 BPM | Dark cyberpunk with heavy bass |
| `lofi-example.axml` | Lo-Fi | 75 BPM | Relaxing study beat |
| `chiptune-example.axml` | Chiptune | 160 BPM | Retro 8-bit adventure |

---

## Statistics

### **File Count**
- **Total Files**: 30+
- **JavaScript Files**: 23
- **AXML Templates**: 3
- **Documentation**: 3
- **Configuration**: 3

### **Code Lines**
- **Total Code**: ~5,000+ lines
- **Commands**: ~2,000 lines
- **Structures**: ~1,700 lines
- **Events**: ~600 lines
- **Utils**: ~500 lines

### **Features**
- **Commands**: 14
- **Events**: 2
- **Structures**: 5
- **Utilities**: 2
- **Templates**: 3
- **Export Formats**: 5 (WAV, MP3, MIDI, AXML, SVG)
- **Visualizations**: 4 (Piano roll, waveform, spectrum, notation)
- **Instruments**: 11 types
- **Effects**: 10+ types

---

## Key Technologies

### **Dependencies**
- `discord.js` v14.14.1 - Discord API
- `@discordjs/voice` v0.16.1 - Voice integration
- `xml2js` v0.6.2 - XML parsing
- `axios` v1.6.5 - HTTP requests
- `@napi-rs/canvas` v0.1.44 - SVG generation
- `express` v4.18.2 - Health check API
- `fluent-ffmpeg` v2.1.2 - Audio processing

### **APIs**
- **Groq API** - AI music generation
- **Discord API** - Bot interactions
- **Voice API** - Audio playback

---

## Environment Requirements

- **Node.js**: >= 16.0.0
- **NPM**: >= 8.0.0
- **Memory**: 512MB minimum (1GB recommended)
- **Storage**: 100MB + temp space
- **Network**: Stable connection for Groq API

---

## Configuration Files

### **config.js**
```javascript
{
  groqApiKey: "YOUR_API_KEY",
  bot: { token, owners, prefix, version },
  theme: { primary, success, error, ... },
  axml: { maxTracks, sampleRate, ... },
  limits: { maxFileSize, maxGenerations, ... },
  paths: { temp, assets, templates, ... }
}
```

---

## Deployment

### **Windows**
```bash
start.bat
```

### **Linux/Mac**
```bash
npm start
```

### **Development**
```bash
npm run dev  # With nodemon
```

---

## Maintenance

### **Cleanup**
```bash
~cleanup [hours]  # Admin command
```

### **Logs**
- Located in `logs/` directory
- Auto-generated by bot
- Contains error traces

### **Temp Files**
- Auto-cleaned every hour
- Manual cleanup via admin command
- Located in `temp/` directory

---

**Last Updated**: February 14, 2026
**Version**: 4.0.0-ULTIMATE
**Maintainer**: AXML Studio Team
