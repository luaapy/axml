# 🎹 AXML Studio Pro - Discord Music Production Bot

**Version 3.0.0-ULTIMATE**

The world's most advanced Discord music production bot utilizing the **Audio XML (AXML) standard** for code-based composition, real-time audio synthesis, and collaborative digital audio workstation functionality.

---

## 🌟 Features

### **🤖 AI Music Generation (60+ Features)**
- **Text-to-Music Generation** using Groq API
- **Genre-Specific Templates** (Synthwave, Lo-Fi, Chiptune, Ambient, Jazz)
- **Mood-to-Parameter Mapping** (Happy, Sad, Calm, Aggressive, Tense)
- **Intelligent Prompt Analysis** with automatic genre/tempo/key detection
- **Melody Completion** AI
- **Harmony Generator** with chord progression creation
- **Bass Line Creator**
- **Drum Pattern Synthesizer**

### **🎵 Audio Engine**
- **Real WAV Synthesis** (48kHz/24-bit stereo)
- **Multi-Track Rendering** (up to 32 simultaneous tracks)
- **8 Oscillator Types**: sine, square, sawtooth, triangle, noise, piano, bass, drums
- **ADSR Envelope Generator** (Attack, Decay, Sustain, Release)
- **Polyphony Engine** with unlimited simultaneous notes
- **Stereo Panning** (-100% to +100%)
- **Sample-Accurate Timing**

### **📊 Visualization System**
- **Piano Roll Renderer** (SVG)
- **Waveform Display** (time-domain visualization)
- **Spectrum Analyzer** (frequency visualization)
- **Musical Notation Export** (sheet music SVG)
- **Progress Bar Generator**
- **3D Audio Visualizer** (frequency bars)

### **🎛️ Audio Effects Suite**
- **Reverb** (Room, Hall, Plate)
- **Stereo Delay** (Ping-pong, synchronized)
- **Distortion** (Tube, Fuzz, Overdrive)
- **Filters** (Low-pass, High-pass, Band-pass)
- **Compressor/Limiter**
- **Chorus, Flanger, Phaser**
- **Bitcrusher** (lo-fi effect)
- **3-Band EQ**

### **💾 Export Formats**
- **WAV** (48kHz/24-bit, uncompressed)
- **MP3** (320kbps CBR)
- **MIDI** (Standard MIDI 1.0)
- **AXML** (XML format)
- **SVG** (Visualizations)

---

## 🚀 Quick Start

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/axml-bot-discord.git
   cd axml-bot-discord
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the bot:**
   - Edit `config.js` with your **Discord Bot Token**
   - Add your **Groq API Key** for AI generation
   - Set your **Discord User ID** as owner

4. **Start the bot:**
   ```bash
   npm start
   ```

---

## 🎮 Commands

### **🤖 AI Generation**
| Command | Description | Example |
|---------|-------------|---------|
| `~gen [prompt]` | Generate music from text | `~gen Dark cyberpunk bassline at 128 BPM` |
| `~gen [prompt]` | AI music generation via modal | Click "Edit AXML" button |

### **🎵 Rendering & Playback**
| Command | Description | Example |
|---------|-------------|---------|
| `~render [file]` | Parse and render AXML | `~render` (attach .axml file) |
| Button: ▶️ Play | Play in voice channel | Click Play button |
| Button: ⏸️ Pause | Pause playback | Click Pause button |
| Button: ⏹️ Stop | Stop and disconnect | Click Stop button |

### **💾 Export & Files**
| Command | Description | Example |
|---------|-------------|---------|
| `~export [format]` | Export to format | `~export wav`, `~export all` |
| `~export wav` | Export WAV (48kHz/24-bit) | `~export wav` |
| `~export mp3` | Export MP3 (in development) | `~export mp3` |
| `~export xml` | Download AXML | `~export xml` |
| `~export svg` | Download visualization | `~export svg` |
| `~export all` | Export all formats | `~export all` |
|  Button: 💾 Export WAV | Quick WAV export | Click button |
| Button: 📤 Export AXML | Quick AXML export | Click button |

### **📊 Visualization**
| Command | Description | Example |
|---------|-------------|---------|
| `~visualize [type]` | Generate visualization | `~visualize pianoroll` |
| `~visualize pianoroll` | Piano roll view | `~visualize pianoroll` |
| `~visualize waveform` | Waveform display | `~visualize waveform` |
| `~visualize spectrum` | Frequency spectrum | `~visualize spectrum` |
| `~visualize notation` | Sheet music | `~visualize notation` |
| Button: 📊 Visualize | Quick visualization | Click button |

### **🎛️ Effects & Editing**
| Command | Description | Example |
|---------|-------------|---------|
| `~transpose [±semitones]` | Transpose key | `~transpose +5`, `~transpose -3` |
| `~tempo [BPM]` | Change tempo/BPM | `~tempo 140`, `~tempo 90` |
| Button: 🎛️ Effects | Open effect selector | Click button |
| Button: 🎚️ Mixer | View track mixer | Click button |

### **📚 Templates & Sessions**
| Command | Description | Example |
|---------|-------------|---------|
| `~template [name]` | Load AXML template | `~template synthwave` |
| `~template` | List all templates | `~template` |
| `~sessions` | View active sessions | `~sessions` |
| `~sessions delete [id]` | Delete a session | `~sessions delete abc123` |
| `~sessions delete` | Clear all sessions | `~sessions delete` |
| `~sessions info [id]` | Session details | `~sessions info abc123` |

### **🔧 Tools & Info**
| Command | Description | Example |
|---------|-------------|---------|
| `~help [category]` | Command reference | `~help`, `~help generation` |
| `~stats` | Bot statistics | `~stats` |

---

## 📖 AXML Standard Quick Reference

### **Basic Structure**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<axml version="1.0">
  <metadata>
    <title>My Song</title>
    <artist>Your Name</artist>
    <tempo>120</tempo>
    <time-signature>4/4</time-signature>
    <key>Am</key>
  </metadata>
  
  <instruments>
    <instrument id="lead" type="sawtooth" volume="0.8" attack="0.01" release="0.2"/>
    <instrument id="bass" type="sine" volume="0.9" octave="-1"/>
  </instruments>
  
  <tracks>
    <track instrument="lead" name="Lead Melody">
      <note pitch="A4" duration="quarter" velocity="0.9"/>
      <note pitch="B4" duration="eighth" velocity="0.85"/>
      <note pitch="C5" duration="half" velocity="0.8"/>
    </track>
    
    <track instrument="bass" name="Bass Line">
      <note pitch="A2" duration="whole" velocity="0.85"/>
    </track>
  </tracks>
</axml>
```

### **Valid Instruments**
- `sine` - Pure sine wave
- `square` - Square wave (8-bit, retro)
- `sawtooth` - Sawtooth wave (bright, brassy)
- `triangle` - Triangle wave (soft, flute-like)
- `noise` - White noise
- `piano` - Acoustic piano
- `bass` - Electric bass
- `drum_808` - TR-808 drums
- `drum_909` - TR-909 drums
- `pad` - Synthesizer pad
- `strings` - Orchestral strings

### **Note Format**
- **Pitch**: `C4`, `D#5`, `Bb3` (Note + Accidental + Octave 0-8)
- **Special**: `rest` for silence
- **Duration**: `whole`, `half`, `quarter`, `eighth`, `sixteenth`
  - Shorthand: `w`, `h`, `q`, `e`, `s`
  - Dotted: `quarter.d` (1.5x duration)
- **Velocity**: `0.0` to `1.0` (loudness/intensity)

### **Chord Notation**
```xml
<chord start="0">
  <note pitch="C4" duration="whole" velocity="0.8"/>
  <note pitch="E4" duration="whole" velocity="0.8"/>
  <note pitch="G4" duration="whole" velocity="0.8"/>
</chord>
```

---

## 🎨 Visual Identity

**CRITICAL COLOR SCHEME (STRICTLY ENFORCED):**
- **Primary**: Cyan `#00FFFF` / `rgb(0,255,255)`
- **Background**: True Black `#000000` / `rgb(0,0,0)`
- **Success**: Electric Green `#00FF00` / `rgb(0,255,0)`
- **Warning**: Amber `#FFA500` / `rgb(255,165,0)`
- **Error**: Critical Red `#FF0000` / `rgb(255,0,0)`
- **Secondary**: Dark Slate `#2F4F4F` / `rgb(47,79,79)`
- **🚫 ABSOLUTELY NO PURPLE/VIOLET COLORS**

---

## 🔧 Configuration

### **config.js**
```javascript
module.exports = {
    groqApiKey: "YOUR_GROQ_API_KEY",
    aiModel: "llama-3.1-8b-instant",
    bot: {
        token: "YOUR_DISCORD_BOT_TOKEN",
        owners: 'YOUR_DISCORD_ID',
        prefix: '~',
        version: '3.0.0-ULTIMATE'
    },
    theme: {
        primary: '#00FFFF',
        background: '#000000',
        success: '#00FF00',
        warning: '#FFA500',
        error: '#FF0000',
        secondary: '#2F4F4F'
    },
    axml: {
        maxTracks: 32,
        maxDuration: 600,
        maxNotes: 10000,
        sampleRate: 48000,
        bitDepth: 24
    },
    limits: {
        maxFileSize: 8388608, // 8MB
        maxGenerationsPerMinute: 5,
        maxCollaborators: 10
    }
};
```

---

## 🏗️ Architecture

### **Core Modules**

1. **AXMLEngine.js** - XML parsing, validation, auto-correction
2. **SVGGenerator.js** - Visual generation (piano roll, waveforms, spectrum)
3. **AIGenerator.js** - Groq API integration, prompt analysis, music generation
4. **AudioSynthesizer.js** - Real-time WAV synthesis, oscillators, ADSR
5. **UIComponents.js** - Discord embeds, buttons, modals, select menus

### **Directory Structure**
```
axml-bot-discord/
├── commands/
│   ├── axml/          # AI generation, rendering
│   ├── tools/         # Help, stats, visualize
│   ├── music/         # Playback controls
│   └── effects/       # Audio effects
├── structures/        # Core engine modules
├── events/            # Discord event handlers
├── assets/            # Templates, fonts, SVG
├── temp/              # Temporary file storage
├── logs/              # Application logs
├── config.js          # Bot configuration
└── index.js           # Main entry point
```

---

## 📚 Resources

- **Official AXML Documentation**: [luaapy.github.io/axml/](https://luaapy.github.io/axml/)
- **GitHub Repository**: [github.com/luaapy/axml](https://github.com/luaapy/axml)
- **Example AXML Files**: [Examples](https://github.com/luaapy/axml/tree/main/examples)

---

## 🛠️ Development

### **Error Codes**
- `ERR_XML_001` - Malformed XML structure
- `ERR_XML_002` - Invalid attribute value
- `ERR_REF_003` - Undefined instrument reference
- `ERR_AUDIO_004` - Rendering timeout
- `ERR_AUDIO_005` - Voice connection failed
- `ERR_IO_006` - File size exceeded
- `ERR_PARSE_007` - Ambiguous duration notation

### **Rate Limiting**
- **5 generations per minute** per user
- **32 simultaneous tracks** maximum
- **10 minutes** maximum composition duration
- **10,000 notes** per track maximum

---

## 📊 System Requirements

- **Node.js** 16.x or higher
- **Discord.js** v14.14.1
- **Memory**: 512MB minimum (1GB recommended)
- **Storage**: 100MB for bot + temp file space
- **Network**: Stable connection for Groq API

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🙏 Credits

- **AXML Standard**: [luaapy](https://github.com/luaapy)
- **AI Engine**: Groq API
- **Discord Integration**: Discord.js
- **Audio Synthesis**: Custom WebAudio-inspired engine

---

## 📞 Support

- **Discord**: [Join Support Server](https://discord.gg/axml)
- **Issues**: [GitHub Issues](https://github.com/yourusername/axml-bot-discord/issues)
- **Documentation**: [Official Docs](https://luaapy.github.io/axml/)

---

**Built with ❤️ for the music creation community**

**SYSTEM READY. AWAITING USER INPUT.**
