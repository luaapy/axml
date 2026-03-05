class AXMLValidator {
    constructor() {
        this.validInstruments = [
            'sine', 'square', 'sawtooth', 'triangle', 'noise',
            'piano', 'bass', 'drum_808', 'drum_909', 'pad', 'strings'
        ];

        this.validDurations = [
            'whole', 'half', 'quarter', 'eighth', 'sixteenth',
            'w', 'h', 'q', 'e', 's'
        ];

        this.validNotes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    }

    validateMetadata(metadata) {
        const errors = [];
        const warnings = [];

        if (!metadata.title) {
            warnings.push('No title provided, using default');
        }

        if (!metadata.artist) {
            warnings.push('No artist provided');
        }

        // Validate tempo
        const tempo = parseInt(metadata.tempo);
        if (isNaN(tempo) || tempo < 30 || tempo > 300) {
            errors.push(`Invalid tempo: ${metadata.tempo}. Must be between 30-300 BPM`);
        }

        // Validate time signature
        if (metadata.timeSignature && !this.isValidTimeSignature(metadata.timeSignature)) {
            errors.push(`Invalid time signature: ${metadata.timeSignature}`);
        }

        // Validate key
        if (metadata.key && !this.isValidKey(metadata.key)) {
            errors.push(`Invalid key: ${metadata.key}`);
        }

        return { errors, warnings };
    }

    validateInstrument(instrument) {
        const errors = [];
        const warnings = [];

        if (!instrument.id) {
            errors.push('Instrument missing ID');
        }

        if (!instrument.type) {
            errors.push('Instrument missing type');
        } else if (!this.validInstruments.includes(instrument.type)) {
            errors.push(`Invalid instrument type: ${instrument.type}`);
        }

        // Validate volume
        if (instrument.volume !== undefined) {
            const vol = parseFloat(instrument.volume);
            if (isNaN(vol) || vol < 0 || vol > 1) {
                errors.push(`Invalid volume for ${instrument.id}: ${instrument.volume}`);
            }
        }

        // Validate ADSR
        if (instrument.attack !== undefined && (parseFloat(instrument.attack) < 0 || parseFloat(instrument.attack) > 10)) {
            warnings.push(`Unusual attack time for ${instrument.id}: ${instrument.attack}`);
        }

        if (instrument.release !== undefined && (parseFloat(instrument.release) < 0 || parseFloat(instrument.release) > 10)) {
            warnings.push(`Unusual release time for ${instrument.id}: ${instrument.release}`);
        }

        return { errors, warnings };
    }

    validateNote(note) {
        const errors = [];
        const warnings = [];

        // Validate pitch
        if (note.pitch !== 'rest' && !this.isValidPitch(note.pitch)) {
            errors.push(`Invalid pitch: ${note.pitch}`);
        }

        // Validate duration
        if (!note.duration || !this.validDurations.includes(note.duration.replace('.d', ''))) {
            errors.push(`Invalid duration: ${note.duration}`);
        }

        // Validate velocity
        if (note.velocity !== undefined) {
            const vel = parseFloat(note.velocity);
            if (isNaN(vel) || vel < 0 || vel > 1) {
                errors.push(`Invalid velocity: ${note.velocity}`);
            }
        }

        return { errors, warnings };
    }

    isValidTimeSignature(timeSig) {
        const pattern = /^\d+\/\d+$/;
        if (!pattern.test(timeSig)) {
            return false;
        }

        const [numerator, denominator] = timeSig.split('/').map(n => parseInt(n));

        // Common time signatures
        const validDenominators = [2, 4, 8, 16];
        return numerator >= 1 && numerator <= 32 && validDenominators.includes(denominator);
    }

    isValidKey(key) {
        const root = key.replace('m', '');
        return this.validNotes.includes(root);
    }

    isValidPitch(pitch) {
        const match = pitch.match(/^([A-G][#b]?)(\d)$/);
        if (!match) {
            return false;
        }

        const [, note, octave] = match;
        const oct = parseInt(octave);

        return this.validNotes.includes(note) && oct >= 0 && oct <= 8;
    }

    validateTrack(track, instruments) {
        const errors = [];
        const warnings = [];

        if (!track.instrument) {
            errors.push('Track missing instrument reference');
        } else {
            // Check if instrument exists
            const instrumentExists = instruments.some(inst => inst.id === track.instrument);
            if (!instrumentExists) {
                errors.push(`Track references undefined instrument: ${track.instrument}`);
            }
        }

        if (!track.notes || track.notes.length === 0) {
            warnings.push('Track has no notes');
        }

        // Validate each note
        if (track.notes) {
            track.notes.forEach((note, index) => {
                const noteValidation = this.validateNote(note);

                noteValidation.errors.forEach(err => {
                    errors.push(`Note ${index + 1}: ${err}`);
                });

                noteValidation.warnings.forEach(warn => {
                    warnings.push(`Note ${index + 1}: ${warn}`);
                });
            });
        }

        return { errors, warnings };
    }

    validateCompleteAXML(axmlData) {
        const allErrors = [];
        const allWarnings = [];

        // Validate metadata
        if (axmlData.metadata) {
            const metaValidation = this.validateMetadata(axmlData.metadata);
            allErrors.push(...metaValidation.errors);
            allWarnings.push(...metaValidation.warnings);
        } else {
            allErrors.push('Missing metadata section');
        }

        // Validate instruments
        if (axmlData.instruments) {
            axmlData.instruments.forEach((instrument, index) => {
                const instValidation = this.validateInstrument(instrument);

                instValidation.errors.forEach(err => {
                    allErrors.push(`Instrument ${index + 1}: ${err}`);
                });

                instValidation.warnings.forEach(warn => {
                    allWarnings.push(`Instrument ${index + 1}: ${warn}`);
                });
            });
        } else {
            allErrors.push('Missing instruments section');
        }

        // Validate tracks
        if (axmlData.tracks) {
            axmlData.tracks.forEach((track, index) => {
                const trackValidation = this.validateTrack(track, axmlData.instruments || []);

                trackValidation.errors.forEach(err => {
                    allErrors.push(`Track ${index + 1}: ${err}`);
                });

                trackValidation.warnings.forEach(warn => {
                    allWarnings.push(`Track ${index + 1}: ${warn}`);
                });
            });
        } else {
            allErrors.push('Missing tracks section');
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings
        };
    }

    sanitizeAXML(axmlData) {
        const sanitized = JSON.parse(JSON.stringify(axmlData));

        // Set defaults for metadata
        if (!sanitized.metadata) {
            sanitized.metadata = {};
        }

        sanitized.metadata.title = sanitized.metadata.title || 'Untitled';
        sanitized.metadata.artist = sanitized.metadata.artist || 'Unknown';
        sanitized.metadata.tempo = sanitized.metadata.tempo || 120;
        sanitized.metadata.timeSignature = sanitized.metadata.timeSignature || '4/4';
        sanitized.metadata.key = sanitized.metadata.key || 'C';

        // Sanitize instruments
        if (sanitized.instruments) {
            sanitized.instruments.forEach(inst => {
                inst.volume = inst.volume !== undefined ? parseFloat(inst.volume) : 0.7;
                inst.attack = inst.attack !== undefined ? parseFloat(inst.attack) : 0.01;
                inst.decay = inst.decay !== undefined ? parseFloat(inst.decay) : 0.1;
                inst.sustain = inst.sustain !== undefined ? parseFloat(inst.sustain) : 0.7;
                inst.release = inst.release !== undefined ? parseFloat(inst.release) : 0.3;
            });
        }

        // Sanitize tracks
        if (sanitized.tracks) {
            sanitized.tracks.forEach(track => {
                track.name = track.name || 'Untitled Track';

                if (track.notes) {
                    track.notes.forEach(note => {
                        note.velocity = note.velocity !== undefined ? parseFloat(note.velocity) : 0.8;
                    });
                }
            });
        }

        return sanitized;
    }
}

module.exports = AXMLValidator;
