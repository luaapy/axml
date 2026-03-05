const fs = require('fs');
const { getNoteFrequency, getDurationInBeats } = require('./music-theory');
const { NOTE_DURATIONS } = require('../utils/constants');

class AudioRenderer {
  constructor() {
    this.sampleRate = 48000;
    this.bitDepth = 16;
    this.channels = 2;
  }

  createWavHeader(dataLength, sampleRate, channels, bitDepth) {
    const buffer = Buffer.alloc(44);
    
    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    buffer.write('WAVE', 8);
    
    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28); // ByteRate
    buffer.writeUInt16LE(channels * (bitDepth / 8), 32); // BlockAlign
    buffer.writeUInt16LE(bitDepth, 34);
    
    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    
    return buffer;
  }

  /**
   * Renders AXML to a WAV buffer.
   * @param {Object} axmlData - Parsed AXML object.
   * @returns {Buffer} WAV file buffer.
   */
  render(axmlData) {
    console.log("Starting render...");
    const tempo = parseInt(axmlData.metadata.tempo, 10) || 120;
    const beatDuration = 60 / tempo; // Seconds per beat

    // Collect all note events
    const events = [];
    
    let tracks = [];
    if (axmlData.tracks && axmlData.tracks.track) {
        tracks = Array.isArray(axmlData.tracks.track) ? axmlData.tracks.track : [axmlData.tracks.track];
    }

    let maxTime = 0;

    tracks.forEach(track => {
      let currentTime = 0; // in beats
      
      let notes = [];
      if (track.note) {
          notes = Array.isArray(track.note) ? track.note : [track.note];
      }
      
      notes.forEach(note => {
        const durationBeats = getDurationInBeats(note.duration);
        const frequency = getNoteFrequency(note.pitch);
        const velocity = parseFloat(note.velocity) || 0.7;
        
        let startTime = currentTime;
        
        // Handle 'start' attribute if present
        if (note.start !== undefined && note.start !== null) {
            startTime = parseFloat(note.start);
            // If explicit start is provided, does it reset the sequential cursor?
            // Usually absolute start doesn't change cursor unless subsequent notes are relative.
            // Let's assume cursor moves to end of this note for next relative note.
            currentTime = startTime;
        }

        const startSeconds = startTime * beatDuration;
        const durationSeconds = durationBeats * beatDuration;
        
        if (frequency > 0) {
            events.push({
                start: startSeconds,
                duration: durationSeconds,
                freq: frequency,
                amp: velocity
            });
            if (startSeconds + durationSeconds > maxTime) maxTime = startSeconds + durationSeconds;
        }
        
        currentTime += durationBeats;
      });
      
      // Handle chords
      if (track.chord) {
          const chords = Array.isArray(track.chord) ? track.chord : [track.chord];
          chords.forEach(chord => {
              const chordStart = parseFloat(chord.start) || currentTime;
              let chordNotes = [];
              if (chord.note) {
                  chordNotes = Array.isArray(chord.note) ? chord.note : [chord.note];
              }
              
              chordNotes.forEach(note => {
                  const durationBeats = getDurationInBeats(note.duration);
                  const frequency = getNoteFrequency(note.pitch);
                  const velocity = parseFloat(note.velocity) || 0.7;
                  
                  const startSeconds = chordStart * beatDuration;
                  const durationSeconds = durationBeats * beatDuration;
                  
                  if (frequency > 0) {
                      events.push({
                          start: startSeconds,
                          duration: durationSeconds,
                          freq: frequency,
                          amp: velocity
                      });
                      if (startSeconds + durationSeconds > maxTime) maxTime = startSeconds + durationSeconds;
                  }
                  // Chords are simultaneous, so we don't advance time per note usually.
                  // But usually after a chord, time advances by chord duration?
                  // XML spec implies chord container has start. Notes inside run parallel.
                  // If sequential notes follow, where do they start?
                  // Usually after the longest note in chord? Or just explicit start?
                  // Let's assume sequential cursor updates to end of longest note in chord if no explicit start provided for next.
                  if (chordStart + durationBeats > currentTime) currentTime = chordStart + durationBeats;
              });
          });
      }
    });
    
    // Add tail
    maxTime += 1.0; 

    const totalSamples = Math.ceil(maxTime * this.sampleRate);
    
    // Use Float32 for mixing to avoid clipping
    const mixBuffer = new Float32Array(totalSamples * this.channels);
    
    events.forEach(event => {
        const startSample = Math.floor(event.start * this.sampleRate);
        const durationSamples = Math.floor(event.duration * this.sampleRate);
        const endSample = startSample + durationSamples;
        
        const attack = 0.01 * this.sampleRate;
        const release = 0.05 * this.sampleRate;
        
        for (let i = 0; i < durationSamples; i++) {
            const currentSampleIndex = startSample + i;
            if (currentSampleIndex >= totalSamples) break;
            
            const time = i / this.sampleRate;
            // Sine wave
            const value = Math.sin(2 * Math.PI * event.freq * time);
            
            // Simple Envelope
            let envelope = 1.0;
            if (i < attack) {
                envelope = i / attack;
            } else if (durationSamples - i < release) {
                envelope = (durationSamples - i) / release;
            }
            
            const sampleValue = value * event.amp * envelope * 0.5; // 0.5 gain per voice
            
            // Stereo Mix (add to both channels)
            mixBuffer[currentSampleIndex * 2] += sampleValue;     // Left
            mixBuffer[currentSampleIndex * 2 + 1] += sampleValue; // Right
        }
    });

    // Convert to Int16
    const outputBuffer = new Int16Array(mixBuffer.length);
    for (let i = 0; i < mixBuffer.length; i++) {
        // Soft clipping / limiting
        let val = mixBuffer[i];
        if (val > 1.0) val = 1.0;
        if (val < -1.0) val = -1.0;
        
        outputBuffer[i] = val * 32767;
    }

    // Create WAV Header
    const header = this.createWavHeader(outputBuffer.length * 2, this.sampleRate, this.channels, this.bitDepth);
    
    // Combine
    // Return Buffer object (Node.js)
    return Buffer.concat([header, Buffer.from(outputBuffer.buffer)]);
  }
}

module.exports = new AudioRenderer();
