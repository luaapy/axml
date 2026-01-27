# AXML (Audio XML) 
 
**Audio XML** - An XML-based markup format for creating music through coding, similar to how SVG works for images. 
 
## 📋 Table of Contents 
- [What is AXML?](#what-is-axml) 
- [Basic Structure](#basic-structure) 
- [AXML Elements](#axml-elements) 
- [How to Create AXML](#how-to-create-axml) 
- [Complete Example](#complete-example) 
- [How to Use](#how-to-use) 
- [Required Information](#required-information) 
 
## 📂 Project Structure

- `src/` - Core library (`axml.js`) and examples data.
- `assets/` - CSS and static assets.
- `schemas/` - XML Schema Definition (`axml.xsd`).
- `examples/` - Sample `.axml` files.
- `docs/` - Documentation and tutorials.
- `tests/` - Engine test suites.
- `index.html` - The AXML Studio Pro interface.
- `package.json` - Project metadata and scripts.

---
 
## What is AXML? 
 
AXML is an XML-based markup format for defining music declaratively. Just as SVG defines graphics, AXML allows you to "code" music using a text editor. 
 
**Key Advantages:** 
- ✅ Text-based, version control friendly (Git) 
- ✅ Human-readable and easy to edit 
- ✅ Lightweight and portable 
- ✅ Can be rendered in browsers using JavaScript 
- ✅ Follows the familiar concepts of SVG 
 
--- 
 
## Basic Structure 
 
```xml 
<?xml version="1.0" encoding="UTF-8"?> 
<axml version="1.0"> 
  <metadata> 
    <!-- Music Information --> 
  </metadata> 
  <instruments> 
    <!-- Instrument Definitions --> 
  </instruments> 
  <tracks> 
    <!-- Music Tracks --> 
  </tracks> 
</axml> 
``` 
 
--- 
 
## AXML Elements 
 
### 1. `<axml>` - Root Element 
The primary element that wraps all content. 
 
**Attributes:** 
- `version` - AXML version (e.g., "1.0") 
 
```xml 
<axml version="1.0"> 
  ... 
</axml> 
``` 
 
--- 
 
### 2. `<metadata>` - Music Information 
Information about the music piece. 
 
**Child elements:** 
- `<title>` - Music title 
- `<artist>` - Artist/Creator name 
- `<tempo>` - Tempo in BPM (Beats Per Minute) 
- `<time-signature>` - Time signature (e.g., 4/4, 3/4) 
- `<key>` - Musical key (e.g., C, Am, G) 
- `<duration>` - Total duration (optional) 
 
```xml 
<metadata> 
  <title>Simple Song</title> 
  <artist>Your Name</artist> 
  <tempo>120</tempo> 
  <time-signature>4/4</time-signature> 
  <key>C</key> 
</metadata> 
``` 
 
--- 
 
### 3. `<instruments>` - Instrument Definitions 
Defines the instruments used in the piece. 
 
**Child element: `<instrument>`** 
 
**`<instrument>` Attributes:** 
- `id` - Unique instrument ID (referenced in tracks) 
- `type` - Instrument type: 
  - `sine` - Sine wave (clean) 
  - `square` - Square wave (retro/8-bit) 
  - `sawtooth` - Sawtooth wave (bright) 
  - `triangle` - Triangle wave (mellow) 
  - `synth` - Synthesizer 
  - `piano` - Piano 
  - `guitar` - Guitar 
  - `drums` - Drums 
- `volume` - Volume (0.0 - 1.0) 
 
```xml 
<instruments> 
  <instrument id="lead" type="sine" volume="0.7"/> 
  <instrument id="bass" type="sawtooth" volume="0.5"/> 
  <instrument id="drum" type="drums" volume="0.8"/> 
</instruments> 
``` 
 
--- 
 
### 4. `<tracks>` - Music Track 
Contains the actual music tracks to be played. 
 
**Child element: `<track>`** 
 
**`<track>` Attributes:** 
- `instrument` - Reference to an instrument ID 
- `name` - Track name (optional) 
 
**Child element within `<track>`: `<note>`** 
 
--- 
 
### 5. `<note>` - Musical Note 
Defines an individual note to be played. 
 
**Attributes:** 
- `pitch` - Pitch (C, D, E, F, G, A, B) with octave (e.g., C4, A3, G5) 
  - Octave 0-8 (C4 = Middle C) 
  - Use `#` for sharps (C#4) 
  - Use `b` for flats (Bb3) 
- `duration` - Note duration: 
  - `whole` - Full note (1) 
  - `half` - Half note (1/2) 
  - `quarter` - Quarter note (1/4) 
  - `eighth` - Eighth note (1/8) 
  - `sixteenth` - Sixteenth note (1/16) 
  - Or use decimal values (e.g., 0.5, 0.25) 
- `start` - Start time in beats (optional, default: after previous note) 
- `velocity` - Note intensity (0.0 - 1.0, default: 0.7) 
 
**Special Note:** 
- `pitch="rest"` - Silence/Rest note 
 
```xml 
<note pitch="C4" duration="quarter" velocity="0.8"/> 
<note pitch="E4" duration="quarter"/> 
<note pitch="G4" duration="half"/> 
<note pitch="rest" duration="quarter"/> 
``` 
 
--- 
 
### 6. `<chord>` - Chord 
Plays multiple notes simultaneously. 
 
**Child elements:** Multiple `<note>` elements with the same `start` attribute. 
 
```xml 
<chord start="0"> 
  <note pitch="C4" duration="whole"/> 
  <note pitch="E4" duration="whole"/> 
  <note pitch="G4" duration="whole"/> 
</chord> 
``` 
 
Or written inline: 
 
```xml 
<track instrument="piano"> 
  <note pitch="C4" duration="quarter" start="0"/> 
  <note pitch="E4" duration="quarter" start="0"/> 
  <note pitch="G4" duration="quarter" start="0"/> 
</track> 
``` 
 
--- 
 
## How to Create AXML 
 
### Step 1: Define Basic Information 
Before starting, prepare: 
1. **Title** 
2. **Tempo (BPM)** - (Range: 60-200, Average: 120) 
3. **Time Signature** - (4/4 is most common) 
4. **Key** - (C, G, Am, etc.) 
 
### Step 2: Choose Instruments 
Decide which instruments to use: 
- Lead melody → `sine`, `triangle` 
- Bass → `sawtooth`, `square` 
- Pad/Background → `sine`, `triangle` 
- Drums → `drums`, `square` 
 
### Step 3: Compose the Melody 
Write notes in the following format: 
- Pitch (C4, D4, E4, etc.) 
- Duration (quarter, half, whole, etc.) 
- Velocity (intensity, optional) 
 
### Step 4: Assemble the XML 
Combine all elements into a complete AXML file. 
 
--- 
 
## Complete Examples 
 
### Example 1: Simple Melody 
 
```xml 
<?xml version="1.0" encoding="UTF-8"?> 
<axml version="1.0"> 
  <metadata> 
    <title>Twinkle Twinkle Little Star</title> 
    <artist>Traditional</artist> 
    <tempo>120</tempo> 
    <time-signature>4/4</time-signature> 
    <key>C</key> 
  </metadata> 
   
  <instruments> 
    <instrument id="piano" type="sine" volume="0.7"/> 
  </instruments> 
   
  <tracks> 
    <track instrument="piano" name="Melody"> 
      <note pitch="C4" duration="quarter"/> 
      <note pitch="C4" duration="quarter"/> 
      <note pitch="G4" duration="quarter"/> 
      <note pitch="G4" duration="quarter"/> 
      <note pitch="A4" duration="quarter"/> 
      <note pitch="A4" duration="quarter"/> 
      <note pitch="G4" duration="half"/> 
       
      <note pitch="F4" duration="quarter"/> 
      <note pitch="F4" duration="quarter"/> 
      <note pitch="E4" duration="quarter"/> 
      <note pitch="E4" duration="quarter"/> 
      <note pitch="D4" duration="quarter"/> 
      <note pitch="D4" duration="quarter"/> 
      <note pitch="C4" duration="half"/> 
    </track> 
  </tracks> 
</axml> 
``` 
 
--- 
 
## How to Use 
 
### 1. Create an AXML File 
Save your file with the `.axml` extension: 
``` 
my-song.axml 
``` 
 
### 2. Render with JavaScript 
To play AXML in a browser, you need a JavaScript parser. Sample implementation: 
 
```javascript 
// Load AXML content 
const axmlContent = `<?xml version="1.0"?>...`; 
 
// Parse XML 
const parser = new DOMParser(); 
const axmlDoc = parser.parseFromString(axmlContent, 'text/xml'); 
 
// Extract data 
const tempo = axmlDoc.querySelector('tempo').textContent; 
const notes = axmlDoc.querySelectorAll('note'); 
 
// Render with Web Audio API 
const audioCtx = new AudioContext(); 
notes.forEach(note => { 
  const pitch = note.getAttribute('pitch'); 
  const duration = note.getAttribute('duration'); 
  // ... create oscillator and play 
}); 
``` 
 
--- 
 
## Required Information 
 
### For Manual Composition: 
 
1. **Basic Music Theory:** 
    - Notes (C, D, E, F, G, A, B) 
    - Octave (C4 = Middle C) 
    - Duration (whole, half, quarter, etc.) 
    - Tempo and time signature 
 
2. **Note Frequency Reference:** 
    - C4 = 261.63 Hz (Middle C) 
    - D4 = 293.66 Hz 
    - E4 = 329.63 Hz 
    - F4 = 349.23 Hz 
    - G4 = 392.00 Hz 
    - A4 = 440.00 Hz (Standard tuning) 
    - B4 = 493.88 Hz 
 
3. **Duration Values:** 
    - Whole note = 4 beats 
    - Half note = 2 beats 
    - Quarter note = 1 beat 
    - Eighth note = 0.5 beat 
    - Sixteenth note = 0.25 beat 
 
4. **Tempo Guide:** 
    - Grave: 25-45 BPM (very slow) 
    - Largo: 40-60 BPM (slow) 
    - Adagio: 66-76 BPM (relaxed) 
    - Andante: 76-108 BPM (walking pace) 
    - Moderato: 108-120 BPM (moderate) 
    - Allegro: 120-168 BPM (fast) 
    - Presto: 168-200 BPM (very fast) 
 
--- 
 
## AI Prompting 
 
If you want to use AI to generate AXML, use this prompt: 
 
``` 
Create an AXML (Audio XML) file for the song [SONG TITLE]. 
 
Information: 
- Title: [song title] 
- Tempo: [BPM, e.g., 120] 
- Time Signature: [e.g., 4/4] 
- Key: [e.g., C Major] 
- Style: [e.g., simple melody, energetic, calm] 
- Instruments: [e.g., piano, synth, bass] 
 
Requirements: 
1. Use complete AXML structure 
2. Include clear metadata 
3. At least [number] bars/measures 
4. [Additional instructions, e.g., with chord progression C-G-Am-F] 
 
Format the output as valid XML code. 
``` 
 
--- 
 
## Roadmap & Future Development 
 
### v1.0 (Current) 
- ✅ **Advanced Synthesis**: ADSR envelopes (attack, decay, sustain, release)
- ✅ **Filters & Effects**: Lowpass/Highpass filters, Reverb, Distortion, and Panning
- ✅ **Pattern Composition**: `<patterns>` and `<play>` for reusable musical phrases
- ✅ **Real-time Visualizer**: Frequency domain visualizer in the studio
- ✅ **Flexible Durations**: Support for `w`, `h`, `q`, `e`, `s` and decimal values
 
### v2.0 (Planned) 
- ⬜ Audio samples support 
- ⬜ MIDI import/export 
- ⬜ Delay effect enhancement
- ⬜ Visual timeline editor 
- ⬜ Real-time collaboration 
 
--- 
 
## License 
 
AXML is an open format. Feel free to use, modify, and distribute. 
 
--- 
 
## Contribution 
 
To contribute or provide feedback: 
1. Create an issue for bugs or feature requests 
2. Submit a pull request for improvements 
3. Share your AXML files as examples 
 
--- 
 
## Credits 
 
Created by: nsn
Inspired by: SVG (Scalable Vector Graphics), MusicXML, ABC Notation 
