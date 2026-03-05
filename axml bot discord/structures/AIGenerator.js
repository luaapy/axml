const axios = require('axios');
const config = require('../config');

class AIGenerator {
    constructor(aiConfig) {
        this.config = aiConfig || config;
        this.apiKey = this.config.groqApiKey;
        this.model = this.config.aiModel || 'llama-3.1-8b-instant';
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

        this.genreTemplates = {
            synthwave: {
                tempo: [110, 130],
                key: ['Am', 'Dm', 'Em', 'F#m'],
                timeSignature: '4/4',
                instruments: ['sawtooth', 'square', 'drum_808', 'pad'],
                chordProgressions: ['i-VI-III-VII', 'i-iv-VII-iv']
            },
            lofi: {
                tempo: [70, 90],
                key: ['C', 'Am', 'G', 'Dm'],
                timeSignature: '4/4',
                instruments: ['piano', 'bass', 'drum_909', 'pad'],
                chordProgressions: ['I-vi-IV-V', 'ii-V-I']
            },
            chiptune: {
                tempo: [140, 180],
                key: ['C', 'G', 'D', 'A'],
                timeSignature: '4/4',
                instruments: ['square', 'triangle', 'noise'],
                chordProgressions: ['I-V-vi-IV', 'I-IV-V-I']
            },
            ambient: {
                tempo: [40, 60],
                key: ['Am', 'Em', 'Dm'],
                timeSignature: '4/4',
                instruments: ['pad', 'sine', 'noise'],
                chordProgressions: ['i-VI-III', 'i-VII-VI']
            },
            techno: {
                tempo: [125, 135],
                key: ['Cm', 'Gm', 'Fm'],
                timeSignature: '4/4',
                instruments: ['drum_909', 'bass', 'sawtooth'],
                chordProgressions: ['i-i-i-i', 'i-iv-i-v']
            },
            dungeon_synth: {
                tempo: [60, 80],
                key: ['Am', 'Em', 'Gm'],
                timeSignature: '4/4',
                instruments: ['strings', 'piano', 'pad', 'square'],
                chordProgressions: ['i-v-VI-III', 'i-iv-v-i']
            },
            jazz: {
                tempo: [120, 200],
                key: ['C', 'F', 'Bb', 'Eb'],
                timeSignature: '4/4',
                instruments: ['piano', 'bass', 'drum_909'],
                chordProgressions: ['ii-V-I', 'I-VI-ii-V']
            }
        };
    }

    async generateFromPrompt(prompt) {
        try {
            const analysis = this.analyzePrompt(prompt);

            const systemPrompt = `You are "AXML Maestro Pro", a high-performance music production engine.
Your sole mission is to generate complex, professional-quality AXML (Audio XML) code.

### ⛔ ABSOLUTE CRITICAL RULES:
1. Output ONLY the raw AXML code.
2. NO conversational text of any kind.
3. NO markdown code blocks (\`\`\`xml or \`\`\`).
4. NO XML comments (<!-- ... -->).
5. NO headers, footers, or explanations.
6. Start directly with: <?xml version="1.0" encoding="UTF-8"?>
7. End exactly with: </axml>

### MUSICAL SPECIFICATIONS:
- Root Tag: <axml version="1.0">
- Metadata: <metadata><title>, <artist>, <tempo>, <time-signature>, <key>, <genre></metadata>
- Instruments: <instrument id="ID" type="TYPE" volume="VAL" attack="VAL" release="VAL"/>
  (Types: piano, bass, drum_808, drum_909, pad, strings, sawtooth, square, triangle, sine)
- Note Pitch: C0 to C8 (e.g., C#4, Bb2) or "rest".
- Note Duration: whole, half, quarter, eighth, sixteenth.
- Note Velocity: 0.0 to 1.0.

### COMPOSITION GUIDELINES:
- Create professional multilayered compositions with distinct Bass, Harmony, and Lead tracks.
- Use syncopated rhythms and velocity variations for maximum musicality.
- Ensure all XML tags are perfectly balanced and closed.

FAILURE TO RETURN ONLY PURE XML CODE WILL RESULT IN ENGINE FAILURE.
PROMPT: Generate valid AXML code only. No text before or after the code.`;

            const userPrompt = `Generate AXML for: "${prompt}"


            Parameters:
            - Genre: ${analysis.genre}
            - Tempo: ${analysis.tempo} BPM
                - Key: ${analysis.key}

Create a short composition(8 - 16 bars) with 2 - 3 instruments.
                IMPORTANT: Ensure ALL XML tags are properly closed, especially </track >, </tracks >, and </axml > !`;

            const response = await axios.post(
                this.apiUrl,
                {
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.8,
                    max_tokens: 2048
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey} `,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let axmlCode = response.data.choices[0].message.content;

            axmlCode = this.cleanAXMLResponse(axmlCode);

            if (!axmlCode.includes('<?xml')) {
                axmlCode = '<?xml version="1.0" encoding="UTF-8"?>\n' + axmlCode;
            }

            return {
                success: true,
                axml: axmlCode,
                analysis: analysis,
                raw: response.data
            };

        } catch (error) {
            console.error('AI Generation Error:', error.message);

            return {
                success: false,
                axml: this.generateFallbackAXML(prompt),
                analysis: this.analyzePrompt(prompt),
                error: error.message
            };
        }
    }

    analyzePrompt(prompt) {
        const lowerPrompt = prompt.toLowerCase();

        let genre = 'synthwave';
        for (const [genreName, template] of Object.entries(this.genreTemplates)) {
            if (lowerPrompt.includes(genreName)) {
                genre = genreName;
                break;
            }
        }

        if (lowerPrompt.includes('edm') || lowerPrompt.includes('electronic') || lowerPrompt.includes('dance')) genre = 'synthwave';
        if (lowerPrompt.includes('chill') || lowerPrompt.includes('lo-fi') || lowerPrompt.includes('relax')) genre = 'lofi';
        if (lowerPrompt.includes('8-bit') || lowerPrompt.includes('retro') || lowerPrompt.includes('game')) genre = 'chiptune';
        if (lowerPrompt.includes('ambient') || lowerPrompt.includes('drone') || lowerPrompt.includes('space')) genre = 'ambient';
        if (lowerPrompt.includes('techno') || lowerPrompt.includes('dark') || lowerPrompt.includes('industrial')) genre = 'techno';
        if (lowerPrompt.includes('dungeon') || lowerPrompt.includes('fantasy') || lowerPrompt.includes('medieval')) genre = 'dungeon_synth';
        if (lowerPrompt.includes('jazz') || lowerPrompt.includes('swing')) genre = 'jazz';
        if (lowerPrompt.includes('classic') || lowerPrompt.includes('orchestral') || lowerPrompt.includes('symphonic')) genre = 'classical';

        let mood = 'neutral';
        if (lowerPrompt.includes('happy') || lowerPrompt.includes('upbeat') || lowerPrompt.includes('energetic')) mood = 'happy';
        if (lowerPrompt.includes('sad') || lowerPrompt.includes('melancholic') || lowerPrompt.includes('dark')) mood = 'sad';
        if (lowerPrompt.includes('aggressive') || lowerPrompt.includes('intense')) mood = 'aggressive';
        if (lowerPrompt.includes('calm') || lowerPrompt.includes('peaceful') || lowerPrompt.includes('relaxing')) mood = 'calm';

        const template = this.genreTemplates[genre];
        const tempo = this.extractTempo(lowerPrompt) || this.randomInRange(template.tempo[0], template.tempo[1]);
        const key = this.extractKey(lowerPrompt) || this.randomChoice(template.key);

        return {
            genre,
            mood,
            tempo,
            key,
            timeSignature: template.timeSignature,
            instruments: template.instruments,
            chordProgression: this.randomChoice(template.chordProgressions)
        };
    }

    extractTempo(text) {
        const match = text.match(/(\d+)\s*bpm/i);
        return match ? parseInt(match[1]) : null;
    }

    extractKey(text) {
        const keys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
        for (const key of keys) {
            if (text.includes(key.toLowerCase()) && (text.includes('minor') || text.includes('major'))) {
                return text.includes('minor') ? key + 'm' : key;
            }
        }
        return null;
    }

    cleanAXMLResponse(text) {
        // Remove code blocks
        text = text.replace(/```xml\n ? /g, '').replace(/```\n?/g, '');

        // Extract from XML declaration or axml tag to end
        text = text.replace(/^[\s\S]*?(<\?xml|<axml)/i, '$1');

        // Count opening and closing tags
        const openTracks = (text.match(/<tracks>/gi) || []).length;
        const closeTracks = (text.match(/<\/tracks>/gi) || []).length;
        const openTrack = (text.match(/<track\s/gi) || []).length;
        const closeTrack = (text.match(/<\/track>/gi) || []).length;

        // Fix unclosed individual <track> tags
        if (openTrack > closeTrack) {
            const missing = openTrack - closeTrack;
            for (let i = 0; i < missing; i++) {
                // Add missing </track> tags before </tracks> or </axml>
                if (text.includes('</tracks>')) {
                    text = text.replace('</tracks>', '    </track>\n  </tracks>');
                } else if (text.includes('</axml>')) {
                    text = text.replace('</axml>', '    </track>\n  </axml>');
                } else {
                    text += '\n    </track>';
                }
            }
        }

        // Fix unclosed <tracks> tag
        if (openTracks > closeTracks) {
            if (!text.includes('</tracks>')) {
                if (text.includes('</axml>')) {
                    text = text.replace('</axml>', '  </tracks>\n</axml>');
                } else {
                    text += '\n  </tracks>';
                }
            }
        }

        // Ensure we have closing </axml> tag
        if (!text.includes('</axml>')) {
            // If missing, add it at the end
            text = text.trim() + '\n</axml>';
        }

        // Remove any content after closing </axml> tag
        text = text.replace(/(<\/axml>)[\s\S]*$/i, '$1');

        // Fix common XML issues
        text = text.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;'); // Escape unescaped ampersands

        // Ensure proper XML declaration
        if (!text.includes('<?xml')) {
            text = '<?xml version="1.0" encoding="UTF-8"?>\n' + text;
        }

        // Ensure axml root tag exists
        if (!text.includes('<axml')) {
            // Extract content between <?xml> and first tag
            const match = text.match(/<\?xml[^>]*>\s*([\s\S]*)/);
            if (match) {
                text = '<?xml version="1.0" encoding="UTF-8"?>\n<axml version="1.0">\n' + match[1];
                if (!text.includes('</axml>')) {
                    text += '\n</axml>';
                }
            }
        }

        return text.trim();
    }

    generateFallbackAXML(prompt) {
        const analysis = this.analyzePrompt(prompt);

        const xml = [];
        xml.push('<?xml version="1.0" encoding="UTF-8"?>');
        xml.push('<axml version="1.0">');
        xml.push('  <metadata>');
        xml.push(`    < title > AI Generated: ${prompt.substring(0, 50)}</title > `);
        xml.push(`    < artist > AXML Studio AI</artist > `);
        xml.push(`    < tempo > ${analysis.tempo}</tempo > `);
        xml.push(`    < time - signature > ${analysis.timeSignature}</time - signature > `);
        xml.push(`    < key > ${analysis.key}</key > `);
        xml.push(`    < genre > ${analysis.genre}</genre > `);
        xml.push('  </metadata>');

        xml.push('  <instruments>');
        analysis.instruments.forEach((inst, i) => {
            xml.push(`    < instrument id = "inst_${i}" type = "${inst}" volume = "0.7" attack = "0.01" release = "0.3" /> `);
        });
        xml.push('  </instruments>');

        xml.push('  <tracks>');

        xml.push(`    < track instrument = "inst_0" name = "Lead" > `);
        const melody = this.generateMelody(analysis);
        melody.forEach(note => {
            xml.push(`      < note pitch = "${note.pitch}" duration = "${note.duration}" velocity = "${note.velocity}" /> `);
        });
        xml.push('    </track>');

        if (analysis.instruments.length > 1) {
            xml.push(`    < track instrument = "inst_1" name = "Bass" > `);
            const bass = this.generateBass(analysis);
            bass.forEach(note => {
                xml.push(`      < note pitch = "${note.pitch}" duration = "${note.duration}" velocity = "${note.velocity}" /> `);
            });
            xml.push('    </track>');
        }

        if (analysis.instruments.length > 2) {
            xml.push(`    < track instrument = "inst_2" name = "Drums" > `);
            const drums = this.generateDrums(analysis);
            drums.forEach(note => {
                xml.push(`      < note pitch = "${note.pitch}" duration = "${note.duration}" velocity = "${note.velocity}" /> `);
            });
            xml.push('    </track>');
        }

        xml.push('  </tracks>');
        xml.push('</axml>');

        return xml.join('\n');
    }

    generateMelody(analysis) {
        const scale = this.getScale(analysis.key);
        const notes = [];
        const totalBeats = 16;

        let beat = 0;
        while (beat < totalBeats) {
            const pitch = this.randomChoice(scale) + (this.randomChoice([4, 5]));
            const duration = this.randomChoice(['quarter', 'eighth', 'eighth', 'half']);
            const velocity = Math.random() * 0.3 + 0.6;

            notes.push({ pitch, duration, velocity });
            beat += this.durationToBeats(duration);
        }

        return notes;
    }

    generateBass(analysis) {
        const root = analysis.key.replace('m', '');
        const notes = [];

        for (let i = 0; i < 8; i++) {
            notes.push({
                pitch: root + '2',
                duration: 'half',
                velocity: 0.8
            });
        }

        return notes;
    }

    generateDrums(analysis) {
        const notes = [];
        const pattern = ['C4', 'rest', 'D4', 'rest'];

        for (let i = 0; i < 16; i++) {
            notes.push({
                pitch: pattern[i % pattern.length],
                duration: 'quarter',
                velocity: 0.9
            });
        }

        return notes;
    }

    getScale(key) {
        const root = key.replace('m', '');
        const isMinor = key.includes('m');

        const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
        const minorIntervals = [0, 2, 3, 5, 7, 8, 10];

        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = notes.indexOf(root);

        const intervals = isMinor ? minorIntervals : majorIntervals;

        return intervals.map(interval => notes[(rootIndex + interval) % 12]);
    }

    durationToBeats(duration) {
        const map = { 'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25 };
        return map[duration] || 1;
    }

    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

module.exports = AIGenerator;
