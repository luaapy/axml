const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'gen',
    aliases: ['generate', 'ai', 'create'],
    description: 'Generate music from text using AI',
    category: 'axml',
    usage: '~gen [musical description]',
    examples: [
        '~gen Dark cyberpunk bassline with glitchy drums at 128 BPM',
        '~gen Peaceful lo-fi piano in C major',
        '~gen Energetic 8-bit chiptune melody'
    ],

    async execute(message, args, client) {
        if (!args.length) {
            return this.sendErrorNoPrompt(message, client);
        }

        if (client.rateLimiter.isLimited(message.author.id, 'generation')) {
            return this.sendRateLimitError(message, client);
        }

        const prompt = args.join(' ');
        const processingEmbed = client.ui.createProcessingEmbed('Initializing Engine...', 0);
        const processingMsg = await message.reply({
            embeds: [processingEmbed]
        });

        try {
            await this.updateProgress(processingMsg, client, 'Analyzing musical soul...', 15);
            const result = await this.generateMusic(prompt, client);

            if (!result.success) {
                return this.sendAIError(processingMsg, client);
            }

            await this.updateProgress(processingMsg, client, 'Generating AXML structure...', 50);
            const parseResult = await client.axml.parse(result.axml);

            if (!parseResult || !parseResult.success) {
                return this.sendParseError(processingMsg, client, parseResult?.errors || ['Unknown parsing error']);
            }

            await this.updateProgress(processingMsg, client, 'Synthesizing audio...', 90);
            const audioResult = await client.audio.synthesize(parseResult.data);

            if (!audioResult.success) {
                return this.sendAudioError(processingMsg, client, audioResult.error);
            }

            const files = await this.saveGeneratedFiles(
                message.author.id,
                result.axml,
                audioResult.buffer,
                parseResult.data,
                client
            );

            this.createUserSession(message.author.id, result, parseResult, files, prompt, client);
            await this.sendFinalResult(processingMsg, prompt, result, parseResult, audioResult, files, client);

            console.log(`✅ AI Generation complete: ${prompt.substring(0, 50)}...`);

        } catch (error) {
            console.error('Generation Error:', error);
            await this.sendSystemError(processingMsg, client, error.message);
        }
    },

    async generateMusic(userPrompt, client) {
        const { config } = require('../../Modules');

        const systemPrompt = `You are AXML Maestro Pro, an advanced AI music composer that generates production-ready AXML code.

CRITICAL INSTRUCTION: You generate EXACTLY ONE complete song per request. Never create multiple songs unless explicitly asked for a playlist or multiple tracks.

GENRE DEFINITIONS:

1. MONTAGEM (Brazilian Phonk):
   - Tempo: 130-140 BPM
   - Key instruments: Heavily distorted 808 bass (drum_808, volume 1.0), punchy kicks (drum_909), chopped vocal samples (synth with pitch shift)
   - Rhythm: Aggressive syncopated funk beat with repetitive 16th-note patterns
   - Structure: Hypnotic and loop-based with minimal variation

2. SLOWED + REVERB Modifier:
   - Tempo reduction: Multiply base tempo by 0.75-0.85 (e.g., 140 BPM becomes 105-119 BPM)
   - Mandatory effects: Hall reverb with mix above 0.5 and decay above 4.0
   - Additional effect: Lowpass filter at 1500Hz for underwater/dreamy atmosphere
   - Mood: Melancholic, spacious, atmospheric

3. PHONK (Drift):
   - Essential: Cowbell patterns (triangle or high sawtooth)
   - Bass: Distorted 808
   - Scales: Phrygian or Minor
   - Tempo: 140-160 BPM

4. EPIC/ORCHESTRAL:
   - Instruments: Strings, brass (sawtooth), timpani (drum_808)
   - Dynamics: Velocity ramping for crescendos
   - Tempo: 80-120 BPM

5. LOFI HIP HOP:
   - Tempo: 70-90 BPM
   - Timing: Swing feel with delayed second 8th notes
   - Instruments: Electric piano, noise for vinyl crackle
   - Chords: 7th and 9th extensions

DURATION CALCULATION (MANDATORY):
- User asks for 2 minutes (120 seconds).
- Step 1: Calculate total beats needed = (BPM / 60) * 120. (e.g., 135 BPM = 270 beats).
- Step 2: Write your loop pattern for each track (e.g., a 4-beat or 8-beat loop).
- Step 3: Set "repeat" on each <track> to (Total Beats / Your Loop Length).
- Example for 135 BPM 2 minutes (270 beats):
  * If your track loop is 4 beats long -> repeat="68" (270 / 4 ≈ 68).
  * If your track loop is 8 beats long -> repeat="34" (270 / 8 ≈ 34).
  * If your track loop is 2 beats long -> repeat="135" (270 / 2 = 135).
- DONT GUESS. Use the "repeat" attribute to reach exactly 2 minutes.

COMPOSITION RULES:
1. Harmony: Use 7th/9th chords for jazz/lofi, power chords for rock/phonk
2. Rhythm: Incorporate triplets, dotted notes, syncopation for variety
3. Layering: Minimum 4 instrument tracks for full arrangements
4. Dynamics: Vary velocity values between 0.6-1.0 for expression
5. Note Duration: Use string values: 'whole', 'half', 'quarter', 'eighth', 'sixteenth'. Dotted: 'quarter.d', etc.
6. Timing: Use "start" attribute (float, in beats) for precise note placement.
7. Looping: MUST use <track instrument="id" repeat="X"> for all tracks to save tokens and achieve long durations.

OUTPUT REQUIREMENTS:
1. Generate ONLY valid XML without markdown code blocks or explanations.
2. Root element MUST be <axml version="1.0">.
3. NO comments in the XML to conserve tokens.
4. Use maximum output capacity (up to 7000 tokens) for detailed arrangements.
5. IF USER ASKS FOR 2 MINUTES, YOU MUST USE THE REPEAT ATTRIBUTE ON EVERY TRACK.
6. Valid keys: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B.
7. Valid scales: maj, min.

AXML STRUCTURE TEMPLATE:

<axml version="1.0">
  <metadata>
    <title>Generated Title</title>
    <artist>AXML AI</artist>
    <tempo>130</tempo>
    <time-signature>4/4</time-signature>
    <key>F#min</key>
    <genre>Phonk</genre>
  </metadata>
  <instruments>
    <instrument id="kick" type="drum_909" volume="1.0" pan="0"/>
    <instrument id="bass" type="drum_808" volume="0.9" pan="0" attack="0.01" release="0.4"/>
    <instrument id="lead" type="sawtooth" volume="0.7" pan="0.2" attack="0.01" release="0.1"/>
    <instrument id="pad" type="pad" volume="0.5" pan="-0.3" attack="0.5" release="0.8"/>
  </instruments>
  <tracks>
    <track instrument="kick" name="Kick">
      <note pitch="C2" duration="quarter" start="0.0" velocity="1.0"/>
      <note pitch="C2" duration="quarter" start="1.0" velocity="1.0"/>
      <note pitch="C2" duration="quarter" start="2.0" velocity="1.0"/>
      <note pitch="C2" duration="quarter" start="3.0" velocity="1.0"/>
    </track>
    <track instrument="bass" name="808 Bass">
       <note pitch="F#1" duration="half" start="0.0" velocity="0.9"/>
       <note pitch="F#1" duration="quarter" start="2.0" velocity="0.9"/>
       <note pitch="A1" duration="quarter" start="3.0" velocity="0.8"/>
    </track>
  </tracks>
  <effects>
    <reverb type="hall" mix="0.3" decay="2.5"/>
    <delay type="pingpong" time="0.5" feedback="0.4" mix="0.2"/>
    <filter type="lowpass" frequency="12000" resonance="0.2"/>
  </effects>
</axml>

PARSING USER REQUESTS:
When user says "montagem slowed 2 minutes full song":
- Genre: Montagem (Brazilian Phonk)
- Modifier: Slowed (reduce tempo by 15-25 percent)
- Duration: Exactly 2 minutes (120 seconds) of music content
- Output: ONE complete song with calculated beat duration

Generate ONE extensive production-quality AXML composition based on user request: "${userPrompt}"`;

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Generate AXML code for: ${userPrompt}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 7000
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status} `);
            }

            const data = await response.json();
            let axmlCode = data.choices[0].message.content.trim();

            // Clean markdown blocks
            axmlCode = axmlCode.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();

            // Find start
            const xmlStart = axmlCode.indexOf('<?xml');
            const axmlPos = axmlCode.indexOf('<axml');
            const startIndex = xmlStart > -1 ? xmlStart : axmlPos;
            if (startIndex > -1) axmlCode = axmlCode.substring(startIndex);

            // Find end and fix truncation
            const axmlEnd = axmlCode.lastIndexOf('</axml>');

            if (axmlEnd === -1) {
                // Remove the last potentially incomplete tag (e.g., <note pitch="C...)
                const lastTagOpen = axmlCode.lastIndexOf('<');
                if (lastTagOpen > -1 && axmlCode.indexOf('>', lastTagOpen) === -1) {
                    axmlCode = axmlCode.substring(0, lastTagOpen);
                }

                // Heuristic: Close open tags
                if (axmlCode.includes('<track') && !axmlCode.includes('</track>')) {
                    if (axmlCode.includes('<note')) { // In case it cut off inside <track>
                        if (!axmlCode.endsWith('</track>')) {
                            axmlCode += '\n    </track>';
                        }
                    }
                }
                if (axmlCode.includes('<tracks') && !axmlCode.includes('</tracks>')) {
                    axmlCode += '\n  </tracks>';
                }
                axmlCode += '\n</axml>';
            } else {
                axmlCode = axmlCode.substring(0, axmlEnd + 7);
            }

            console.log('\n--- AI RESPONSE CLEANED ---');
            console.log(axmlCode);
            console.log('---------------------------\n');

            const analysis = this.extractAnalysisFromAXML(axmlCode);
            return { success: true, axml: axmlCode, analysis: analysis };

        } catch (error) {
            console.error('Groq API Error:', error);
            return { success: false, error: error.message };
        }
    },

    extractAnalysisFromAXML(axmlCode) {
        try {
            const tempoMatch = axmlCode.match(/<tempo>(\d+)<\/tempo>/);
            const keyMatch = axmlCode.match(/<key>([^<]+)<\/key>/);
            const genre = this.guessGenre(parseInt(tempoMatch?.[1] || 120));

            return {
                tempo: tempoMatch ? parseInt(tempoMatch[1]) : 120,
                key: keyMatch ? keyMatch[1] : 'C',
                genre: genre
            };
        } catch (error) {
            return { tempo: 120, key: 'C', genre: 'Electronic' };
        }
    },

    guessGenre(tempo) {
        if (tempo < 90) return 'Ambient/Lo-fi';
        if (tempo < 125) return 'Pop/House';
        if (tempo < 150) return 'Techno/Trance';
        return 'DnB/Hardcore';
    },

    sendErrorNoPrompt(message, client) {
        const embed = client.ui.createErrorEmbed('ERR_INPUT_001', 'No prompt provided', ['Example: ~gen Lo-fi beat']);
        return message.reply({ embeds: [embed] });
    },

    sendRateLimitError(message, client) {
        return message.reply({ embeds: [client.ui.createRateLimitEmbed(60000)] });
    },

    async sendAIError(processingMsg, client) {
        const embed = client.ui.createErrorEmbed('ERR_AI_001', 'AI generation failed', ['Check connection or try again']);
        return await processingMsg.edit({ embeds: [embed] }).catch(() => { });
    },

    async sendParseError(processingMsg, client, errors) {
        const embed = client.ui.createErrorEmbed('ERR_XML_001', 'Generated AXML has errors', errors.map(e => e.message));
        return await processingMsg.edit({ embeds: [embed] }).catch(() => { });
    },

    async sendAudioError(processingMsg, client, error) {
        const embed = client.ui.createErrorEmbed('ERR_AUDIO_001', 'Audio synthesis failed', [error || 'Unknown error']);
        return await processingMsg.edit({ embeds: [embed] }).catch(() => { });
    },

    async sendSystemError(processingMsg, client, errorMessage) {
        const embed = client.ui.createErrorEmbed('ERR_SYS_001', errorMessage, ['Contact support']);
        if (processingMsg) await processingMsg.edit({ embeds: [embed] }).catch(() => { });
    },

    async updateProgress(processingMsg, client, text, percent) {
        const embed = client.ui.createProcessingEmbed(text, percent);
        await processingMsg.edit({ embeds: [embed] }).catch(() => { });
    },

    async saveGeneratedFiles(userId, axmlContent, audioBuffer, parsedData, client) {
        const timestamp = Date.now();
        const mp3Name = `gen_${userId}_${timestamp}.mp3`;
        const xmlName = `gen_${userId}_${timestamp}.axml`;

        const mp3Path = await client.audio.saveToFile(audioBuffer, mp3Name);
        const xmlPath = path.join(client.config.paths.temp, xmlName);
        fs.writeFileSync(xmlPath, axmlContent);

        return { mp3Path, xmlPath, mp3: mp3Name, xml: xmlName };
    },

    createUserSession(userId, result, parseResult, files, prompt, client) {
        client.sessions.createSession(userId, {
            axml: result.axml,
            parsed: parseResult.data,
            audioPath: files.mp3Path,
            xmlPath: files.xmlPath,
            prompt: prompt,
            analysis: result.analysis
        });
    },

    async sendFinalResult(processingMsg, prompt, result, parseResult, audioResult, files, client) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        const embed = client.ui.createAIGenerationEmbed(prompt, result.analysis, parseResult.data.metadata || {}, audioResult.duration);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_play').setLabel('Play').setEmoji('▶️').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_mixer').setLabel('Mixer').setEmoji('🎚️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('btn_export').setLabel('Export').setEmoji('💾').setStyle(ButtonStyle.Primary)
        );

        await processingMsg.edit({
            content: '',
            embeds: [embed],
            files: [new AttachmentBuilder(files.mp3Path, { name: files.mp3 })],
            components: [row]
        }).catch(err => {
            console.error('Final result error:', err);
        });
    }
};