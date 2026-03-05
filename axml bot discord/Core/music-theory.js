const { NOTE_DURATIONS } = require('../utils/constants');

const NOTE_OFFSETS = {
  "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
};

/**
 * Calculates the frequency of a note using A4=440Hz standard.
 * @param {string} note - Note name (e.g., "A4", "C#5", "Bb3").
 * @returns {number} Frequency in Hz.
 */
function getNoteFrequency(note) {
  if (typeof note !== 'string') return 0;
  if (note.toLowerCase() === "rest") return 0;

  // Regex to separate note name, accidental, and octave
  const regex = /^([A-Ga-g])([#b]?)?(-?\d+)$/;
  const match = note.match(regex);

  if (!match) {
    return 0; // Invalid format
  }

  const [_, name, accidental, octaveStr] = match;
  let octave = parseInt(octaveStr, 10);
  let semitoneOffset = NOTE_OFFSETS[name.toUpperCase()];

  if (accidental === '#') semitoneOffset += 1;
  if (accidental === 'b') semitoneOffset -= 1;

  // MIDI note calculation: (Octave + 1) * 12 + semitoneOffset
  // C4 is MIDI 60. 
  // Octave 4 + 1 = 5. 5 * 12 = 60. C is 0. 60 + 0 = 60. Correct.
  
  const midiNote = (octave + 1) * 12 + semitoneOffset;
  
  // Frequency formula: f = 440 * 2^((n - 69) / 12)
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Converts a duration string to beat count.
 * @param {string|number} duration - Duration string (e.g., "quarter", "1.0", "q") or number.
 * @returns {number} Duration in beats.
 */
function getDurationInBeats(duration) {
  if (typeof duration === 'number') return duration;
  if (!duration) return 1.0;

  let str = duration.toString().toLowerCase();
  
  // Check for dotted notes (e.g., "quarter." or "quarterd")
  let isDotted = false;
  if (str.endsWith('d') || str.endsWith('.')) {
      isDotted = true;
      str = str.slice(0, -1);
      if (str.endsWith('.')) str = str.slice(0, -1); 
  }

  let value = 0;
  // Check if numeric string
  if (!isNaN(parseFloat(str)) && isFinite(str)) {
      value = parseFloat(str);
  } else {
      // Lookup standard durations
      // We normalize shorthand 'q' -> 'quarter' if needed, or just rely on the map
      // The map has 'q', 'quarter', etc.
      // Need to handle plurals if they exist? Prompt implies singular.
      // Prompt says "shorthand: w, h, q, e, s, t".
      // Map covers most.
      
      // Attempt to map directly
      if (require('../utils/constants').NOTE_DURATIONS[str] !== undefined) {
         value = require('../utils/constants').NOTE_DURATIONS[str];
      } else {
         // Fallback default
         value = 1.0; 
      }
  }

  if (isDotted) {
      value *= 1.5;
  }

  return value;
}

module.exports = {
  getNoteFrequency,
  getDurationInBeats
};
