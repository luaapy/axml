# 📘 Bot Commands Guide

Complete reference for all AXML Studio Pro commands with examples and best practices.

---

## Table of Contents
- [Getting Started](#getting-started)
- [AXML Commands](#axml-commands)
- [Music Commands](#music-commands)
- [Effects Commands](#effects-commands)
- [Tools Commands](#tools-commands)
- [Admin Commands](#admin-commands)
- [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Steps
1. Join a Discord server with the bot
2. Type `~help` to see all commands
3. Try generating your first track: `~gen upbeat electronic music`
4. Or load a template: `~template synthwave`

### Basic Workflow
```
1. Generate/Render music
   ~gen your prompt here
   ~render (attach .axml file)
   ~template synthwave

2. Modify if needed
   ~transpose +3
   ~tempo 140

3. Export & Share
   ~export wav
   ~project save MyTrack
```

---

## AXML Commands

### `~gen [prompt]`
Generate AI music from text description.

**Examples:**
```
~gen dark cyberpunk bassline at 140 BPM
~gen lo-fi hip hop beat for studying
~gen epic orchestral battle music in D minor
~gen upbeat chiptune with fast arpeggios
```

**Tips:**
- Include genre, mood, tempo, and key for best results
- Be specific about instruments you want
- Mention chord progressions if desired

---

### `~render [attachment]`
Parse and render an AXML file.

**How to use:**
1. Attach an `.axml` file to your message
2. Type `~render` in the message
3. Bot will parse, validate, and synthesize audio

**Features:**
- Auto-correction of common errors
- Detailed error reporting
- Real WAV synthesis
- Automatic visualization generation

---

## Music Commands

### `~play`
Play current session in voice channel.

**Requirements:**
- You must be in a voice channel
- Bot needs permission to join/speak
- Must have an active session

**Example:**
```
1. Generate music: ~gen chill lofi beat
2. Join voice channel
3. Type: ~play
```

---

### `~stop`
Stop playback and leave voice channel.

**Usage:**
```
~stop
```

---

## Effects Commands

### `~transpose [±semitones]`
Transpose all notes by semitones.

**Parameters:**
- Range: `-12` to `+12` semitones
- Positive values transpose up
- Negative values transpose down

**Examples:**
```
~transpose +5     # Up perfect 4th
~transpose -3     # Down minor 3rd
~transpose +12    # Up one octave
~transpose -7     # Down perfect 5th
```

**What it does:**
- Shifts all pitches
- Updates key signature
- Re-synthesizes audio
- Generates new visualization

---

### `~tempo [BPM]`
Change the tempo/BPM.

**Parameters:**
- Range: `30` to `300` BPM
- Common values: 60-180

**Examples:**
```
~tempo 140    # Fast dance music
~tempo 90     # Slow ballad
~tempo 128    # Standard house
~tempo 75     # Lo-fi hip hop
```

**What it does:**
- Changes playback speed
- Recalculates timing
- Re-synthesizes audio
-Generates new visualization

---

## Tools Commands

### `~export [format]`
Export current session in various formats.

**Formats:**
- `wav` - 48kHz/24-bit uncompressed audio
- `mp3` - 320kbps compressed audio (in development)
- `midi` - Standard MIDI file (in development)
- `xml` - AXML source code
- `svg` - Visualization image
- `all` - All formats at once

**Examples:**
```
~export wav
~export xml
~export all
```

---

### `~template [name]`
Browse and load pre-made templates.

**Usage:**
```
~template              # List all templates
~template synthwave    # Load synthwave template
~template lofi         # Load lo-fi template
~template chiptune     # Load chiptune template
```

**Available Templates:**
- synthwave - Dark cyberpunk electronic
- lofi - Relaxing study beats
- chiptune - Retro 8-bit game music

---

### `~sessions`
Manage your active sessions.

**Sub-commands:**
```
~sessions              # List all your sessions
~sessions delete [id]  # Delete specific session
~sessions delete       # Delete all sessions
~sessions info [id]    # View session details
```

---

### `~project`
Save and load your compositions.

**Sub-commands:**
```
~project save [name]      # Save current session
~project load [name]      # Load saved project
~project list             # List all projects
~project delete [name]    # Delete a project
```

**Examples:**
```
~project save My Epic Track
~project load My Epic Track
~project list
~project delete My Epic Track
```

---

### `~profile [@user]`
View user profile and statistics.

**Usage:**
```
~profile           # Your profile
~profile @user     # Another user's profile
```

**Shows:**
- Total generations, renders, exports
- Playtime statistics
- User preferences
- Saved projects count

---

### `~leaderboard [metric]`
View top users by metric.

**Metrics:**
- `generations` - AI generations
- `renders` - File renders
- `exports` - Exports completed
- `playtime` - Total playtime

**Examples:**
```
~leaderboard
~leaderboard generations
~leaderboard playtime
```

---

### `~visualize [type]`
Generate visualization for current session.

**Types:**
- `pianoroll` - Piano roll view (default)
- `waveform` - Audio waveform
- `spectrum` - Frequency spectrum
- `notation` - Sheet music (experimental)

**Examples:**
```
~visualize
~visualize pianoroll
~visualize waveform
```

---

### `~help [category]`
Display command reference.

**Categories:**
```
~help              # All commands
~help generation   # AI generation
~help rendering    # File rendering
~help export       # Export commands
~help visualize    # Visualization
```

---

### `~stats`
View bot statistics.

**Shows:**
- Active sessions count
- Server/user count
- Memory usage
- Uptime
- Bot version
- AXML version

---

## Admin Commands

*These commands require bot owner permissions*

### `~cleanup [hours]`
Clean up old temporary files and sessions.

**Parameters:**
- hours: Age threshold (default: 1 hour)

**Examples:**
```
~cleanup       # Clean files older than 1 hour
~cleanup 2     # Clean files older than 2 hours
```

---

### `~eval [code]`
Execute JavaScript code (debugging).

**WARNING:** Extremely dangerous! Owner only!

**Example:**
```
~eval client.guilds.cache.size
~eval message.guild.memberCount
```

---

## Tips & Best Practices

### AI Generation Tips
1. **Be Specific**: Include genre, mood, tempo, key
2. **Use Musical Terms**: "minor key", "4/4 time", "arpeggio"
3. **Reference Styles**: "like synthwave", "similar to lo-fi"
4. **Iterate**: Generate, modify with transpose/tempo, regenerate

### Performance Tips
1. **Limit Track Count**: 4-8 tracks for best results
2. **Reasonable Tempo**: 60-180 BPM is optimal
3. **File Size**: Keep renders under 5 minutes
4. **Cleanup**: Delete old sessions regularly

### Quality Tips
1. **Use ADSR Envelopes**: Customize instrument attack/release
2. **Vary Velocity**: Dynamic range makes music more expressive
3. **Add Rests**: Silence is important for rhythm
4. **Layer Instruments**: Combine instruments for rich sound

### Collaboration Tips
1. **Save Projects**: Use `~project save` to preserve work
2. **Share AXML**: Export and share XML files with others
3. **Templates**: Start from templates for quick results
4. **Document**: Name projects clearly

---

## Common Workflows

### Quick Generation
```bash
~gen upbeat electronic track
# Wait for generation
~play
# If you like it
~export wav
~project save MyTrack
```

### Modify Existing
```bash
~template synthwave
~transpose +5
~tempo 150
~export all
```

### Collaborative Editing
```bash
# User 1:
~gen jazz piano in Bb
~export xml

# User 2 downloads AXML, edits it, then:
~render (attach modified file)
~export wav
```

---

## Keyboard Shortcuts & Aliases

Many commands have shorter aliases:

| Full Command | Alias
| `~generate` | `~gen` |
| `~transpose` | `~trans`, `~pitch` |
| `~tempo` | `~bpm`, `~speed` |
| `~template` | `~templates`, `~preset` |
| `~project` | `~proj` |
| `~sessions` | `~session` |
| `~leaderboard` | `~top`, `~lb` |
| `~profile` | `~me` |
| `~play` | `~p` |

---

## Error Codes

Common error codes and solutions:

| Code | Issue | Solution |
|------|-------|----------|
| `ERR_SESSION_001` | No active session | Generate or render music first |
| `ERR_VOICE_001` | Not in voice | Join a voice channel |
| `ERR_XML_001` | Invalid AXML | Check file syntax |
| `ERR_AUDIO_001` | Synthesis failed | Check AXML structure |
| `ERR_INPUT_*` | Invalid input | Check command syntax |
| `ERR_PERM_001` | No permission | Admin/Owner only command |

---

## Support & Resources

- **Documentation**: https://luaapy.github.io/axml/
- **GitHub**: https://github.com/luaapy/axml
- **Discord Support**: Use `~help` in bot channels
- **Examples**: Check `assets/templates/` folder

---

**Last Updated**: February 14, 2026  
**Bot Version**: 4.0.0-ULTIMATE  
**Command Count**: 18+
