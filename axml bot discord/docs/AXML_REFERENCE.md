# AXML Standard v1.0 - Quick Reference

## Table of Contents
- [Document Structure](#document-structure)
- [Metadata](#metadata)
- [Instruments](#instruments)
- [Tracks & Notes](#tracks--notes)
- [Effects](#effects)
- [Examples](#examples)

---

## Document Structure

Every AXML file must follow this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<axml version="1.0">
  <metadata>...</metadata>
  <instruments>...</instruments>
  <tracks>...</tracks>
  <effects>...</effects> <!-- Optional -->
</axml>
```

---

## Metadata

Required information about the composition:

```xml
<metadata>
  <title>Song Title</title>
  <artist>Artist Name</artist>
  <tempo>120</tempo> <!-- 30-300 BPM -->
  <time-signature>4/4</time-signature>
  <key>C</key> <!-- C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B (+ optional 'm' for minor) -->
  <genre>Genre</genre> <!-- Optional -->
  <description>Description</description> <!-- Optional -->
</metadata>
```

---

## Instruments

Define instruments used in the composition:

```xml
<instruments>
  <instrument 
    id="unique_id"
    type="instrument_type"
    volume="0.7"      <!-- 0.0-1.0 -->
    attack="0.01"     <!-- seconds -->
    decay="0.1"       <!-- seconds -->
    sustain="0.7"     <!-- 0.0-1.0 -->
    release="0.3"     <!-- seconds -->
    pan="0"           <!-- -1.0 (left) to 1.0 (right) -->
    octave="0"        <!-- -3 to +3 -->
    detune="0"        <!-- -100 to +100 cents -->
  />
</instruments>
```

### Valid Instrument Types

| Type | Description |
|------|-------------|
| `sine` | Pure sine wave (smooth, flute-like) |
| `square` | Square wave (8-bit, retro, organ-like) |
| `sawtooth` | Sawtooth wave (bright, brassy) |
| `triangle` | Triangle wave (soft, mellow) |
| `noise` | White noise (percussion, effects) |
| `piano` | Acoustic piano |
| `bass` | Electric bass |
| `drum_808` | Roland TR-808 drums |
| `drum_909` | Roland TR-909 drums |
| `pad` | Synthesizer pad (ambient) |
| `strings` | Orchestral strings |

---

## Tracks & Notes

Define musical tracks and their note sequences:

```xml
<tracks>
  <track instrument="instrument_id" name="Track Name">
    
    <!-- Individual Note -->
    <note 
      pitch="C4"          <!-- Note + Octave (0-8) or 'rest' -->
      duration="quarter"  <!-- whole, half, quarter, eighth, sixteenth -->
      velocity="0.8"      <!-- 0.0-1.0 (loudness) -->
      pan="0"             <!-- Optional: -1.0 to 1.0 -->
    />
    
    <!-- Chord -->
    <chord start="0"> <!-- Beat position -->
      <note pitch="C4" duration="whole" velocity="0.8"/>
      <note pitch="E4" duration="whole" velocity="0.8"/>
      <note pitch="G4" duration="whole" velocity="0.8"/>
    </chord>
    
  </track>
</tracks>
```

### Note Pitch Format

- **Format**: `[Note][Accidental][Octave]`
- **Examples**: `C4`, `D#5`, `Bb3`, `F#2`
- **Special**: `rest` for silence
- **Octave Range**: 0-8 (C4 = middle C)

### Duration Types

| Duration | Beats (4/4) | Shorthand |
|----------|-------------|-----------|
| `whole` | 4 | `w` |
| `half` | 2 | `h` |
| `quarter` | 1 | `q` |
| `eighth` | 0.5 | `e` |
| `sixteenth` | 0.25 | `s` |
| `quarter.d` | 1.5 | `q.d` (dotted) |

---

## Effects

Optional audio effects (applied globally):

```xml
<effects>
  <!-- Reverb -->
  <reverb type="hall" mix="0.3" decay="2.5"/>
  <!-- Types: room, hall, plate -->
  
  <!-- Delay -->
  <delay time="0.25" feedback="0.4" mix="0.3"/>
  
  <!-- Filter -->
  <filter type="lowpass" frequency="8000" resonance="0.3"/>
  <!-- Types: lowpass, highpass, bandpass -->
  
  <!-- Distortion -->
  <distortion amount="0.5" type="tube"/>
  <!-- Types: tube, fuzz, overdrive -->
  
  <!-- Compressor -->
  <compressor threshold="-20" ratio="4" attack="0.01" release="0.1"/>
</effects>
```

---

## Examples

### Simple Melody

```xml
<?xml version="1.0" encoding="UTF-8"?>
<axml version="1.0">
  <metadata>
    <title>Simple Melody</title>
    <artist>You</artist>
    <tempo>120</tempo>
    <time-signature>4/4</time-signature>
    <key>C</key>
  </metadata>
  
  <instruments>
    <instrument id="piano" type="piano" volume="0.8"/>
  </instruments>
  
  <tracks>
    <track instrument="piano" name="Melody">
      <note pitch="C4" duration="quarter" velocity="0.8"/>
      <note pitch="E4" duration="quarter" velocity="0.8"/>
      <note pitch="G4" duration="quarter" velocity="0.8"/>
      <note pitch="C5" duration="quarter" velocity="0.9"/>
    </track>
  </tracks>
</axml>
```

### C Major Chord

```xml
<track instrument="piano" name="Chord">
  <chord start="0">
    <note pitch="C4" duration="whole" velocity="0.8"/>
    <note pitch="E4" duration="whole" velocity="0.8"/>
    <note pitch="G4" duration="whole" velocity="0.8"/>
  </chord>
</track>
```

---

## Best Practices

1. **Tempo**: Use 80-140 BPM for most genres
2. **Velocity**: Vary between 0.6-0.9 for natural dynamics
3. **ADSR**: Quick attack (0.001-0.05) for percussive sounds, slow (0.1-1.0) for pads
4. **Instruments**: Use 3-8 instruments for balanced mix
5. **Duration**: Keep compositions under 5 minutes for performance
6. **Effects**: Use sparingly (mix < 0.4) to avoid mud

---

## Common Patterns

### Drum Pattern (4/4)
```xml
<track instrument="drums" name="Drums">
  <note pitch="C4" duration="quarter" velocity="1.0"/>  <!-- Kick -->
  <note pitch="rest" duration="quarter"/>
  <note pitch="D4" duration="quarter" velocity="0.9"/>  <!-- Snare -->
  <note pitch="rest" duration="quarter"/>
</track>
```

### Bass Line
```xml
<track instrument="bass" name="Bass">
  <note pitch="C2" duration="half" velocity="0.9"/>
  <note pitch="E2" duration="quarter" velocity="0.85"/>
  <note pitch="G2" duration="quarter" velocity="0.85"/>
</track>
```

### Arpeggio
```xml
<track instrument="synth" name="Arp">
  <note pitch="C4" duration="sixteenth" velocity="0.7"/>
  <note pitch="E4" duration="sixteenth" velocity="0.7"/>
  <note pitch="G4" duration="sixteenth" velocity="0.7"/>
  <note pitch="C5" duration="sixteenth" velocity="0.7"/>
</track>
```

---

**Official Documentation**: [luaapy.github.io/axml/](https://luaapy.github.io/axml/)

**GitHub**: [github.com/luaapy/axml](https://github.com/luaapy/axml)
