# Getting Started with AXML

Welcome to **AXML (Audio XML)**! This guide will help you understand how to create your first music piece using XML.

## 1. The Basic Structure

Every AXML file starts with the `<axml>` root tag:

```xml
<axml version="1.0">
  <!-- Your code here -->
</axml>
```

## 2. Setting Up Metadata

Define your song's name, artist, and tempo (BPM):

```xml
<metadata>
  <title>My First Song</title>
  <artist>You</artist>
  <tempo>120</tempo>
</metadata>
```

## 3. Defining Instruments

Choose what sound you want. You can use standard waveforms: `sine`, `square`, `sawtooth`, `triangle`.

```xml
<instruments>
  <instrument id="lead" type="synth" volume="0.7" attack="0.1" release="0.5" />
</instruments>
```

## 4. Writing Tracks and Notes

Notes have a `pitch` (e.g., C4, D#4) and a `duration` (`w`, `h`, `q`, `e`, `s`).

```xml
<tracks>
  <track instrument="lead">
    <note pitch="C4" duration="q" />
    <note pitch="E4" duration="q" />
    <note pitch="G4" duration="h" />
  </track>
</tracks>
```

## 5. Advanced Features

### Patterns
You can reuse musical phrases:

```xml
<patterns>
  <pattern id="drum_beat">
    <note pitch="C2" duration="q" />
    <note pitch="C2" duration="q" />
  </pattern>
</patterns>

<tracks>
  <track instrument="drums">
    <play pattern="drum_beat" start="0" />
    <play pattern="drum_beat" start="2" />
  </track>
</tracks>
```

### Effects
Customize your instruments with `reverb`, `cutoff`, and `distortion`.

---
Happy Composing! 🎵
