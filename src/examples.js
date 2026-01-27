var AXML_EXAMPLES = {
  "Happy Birthday": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="1.0">
    <metadata>
        <title>Happy Birthday</title>
        <artist>AXML Studio</artist>
        <tempo>120</tempo>
        <key>C</key>
    </metadata>
    <instruments>
        <instrument id="piano" type="sine" volume="0.6" attack="0.05" decay="0.1" sustain="0.7" release="0.5" reverb="0.2" />
    </instruments>
    <tracks>
        <track instrument="piano" name="Melody">
            <note pitch="C4" duration="q" /><note pitch="C4" duration="q" />
            <note pitch="D4" duration="h" /><note pitch="C4" duration="h" />
            <note pitch="F4" duration="h" /><note pitch="E4" duration="w" />
        </track>
    </tracks>
</axml>`,
  "Neon Dreams": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="1.0">
  <metadata>
    <title>Neon Dreams</title>
    <artist>Claude</artist>
    <tempo>120</tempo>
    <key>C</key>
  </metadata>
  <instruments>
    <instrument id="lead" type="sine" volume="0.6" attack="0.05" decay="0.2" sustain="0.6" release="0.4" cutoff="5000" reverb="0.3" />
    <instrument id="bass" type="sawtooth" volume="0.5" attack="0.01" decay="0.1" sustain="0.8" release="0.2" cutoff="800" distortion="0.4" />
    <instrument id="pad" type="triangle" volume="0.4" attack="1.5" decay="0.5" sustain="0.7" release="2.0" cutoff="2000" reverb="0.6" pan="-0.5" />
  </instruments>
  <tracks>
    <track instrument="pad" name="Intro Pad">
      <note pitch="C4" duration="whole" start="0"/><note pitch="E4" duration="whole" start="0"/><note pitch="G4" duration="whole" start="0"/>
    </track>
    <track instrument="bass" name="Bass Line">
      <note pitch="C2" duration="whole" start="0"/><note pitch="A2" duration="whole" start="4"/>
    </track>
  </tracks>
</axml>`,
  "Lofi Chill Day": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="1.0">
  <metadata>
    <title>Lofi Chill Night</title>
    <artist>AXML Pro</artist>
    <tempo>85</tempo>
  </metadata>
  <instruments>
    <instrument id="rhodes" type="triangle" volume="0.5" attack="0.1" release="0.8" cutoff="1500" reverb="0.6" />
    <instrument id="beat" type="kick" volume="0.7" attack="0.01" release="0.1" />
  </instruments>
  <tracks>
    <track instrument="rhodes" name="Chords">
      <chord start="0" duration="w"><note pitch="G3" /><note pitch="Bb3" /><note pitch="D4" /><note pitch="F4" /></chord>
    </track>
    <track instrument="beat" name="Kick">
      <note pitch="C2" duration="q" start="0" /><note pitch="C2" duration="q" start="2" />
    </track>
  </tracks>
</axml>`,
  "Cyberpunk City": `<?xml version="1.0" encoding="UTF-8"?>
<axml version="1.0">
  <metadata>
    <title>Cyberpunk City</title>
    <artist>AXML Master</artist>
    <tempo>128</tempo>
    <key>Am</key>
  </metadata>
  <instruments>
    <instrument id="kick" type="kick" volume="1.0" attack="0.01" release="0.1" distortion="0.2" />
    <instrument id="snare" type="snare" volume="0.8" attack="0.01" release="0.1" cutoff="1500" />
    <instrument id="cyberbass" type="sawtooth" volume="0.7" attack="0.01" decay="0.1" sustain="0.6" release="0.2" 
                cutoff="650" resonance="12" distortion="0.4" lfoRate="4" lfoAmount="0.3" lfoTarget="cutoff" />
    <instrument id="lead" type="square" volume="0.5" attack="0.05" decay="0.2" sustain="0.4" release="0.4" 
                cutoff="2500" resonance="8" chorus="0.6" reverb="0.4" lfoRate="6" lfoAmount="0.1" lfoTarget="pan" />
  </instruments>
  <tracks>
    <track instrument="kick" name="Drums">
      <note pitch="C2" start="0" duration="q" /><note pitch="C2" start="1" duration="q" />
      <note pitch="C2" start="2" duration="q" /><note pitch="C2" start="3" duration="q" />
    </track>
    <track instrument="cyberbass" name="Bass">
      <note pitch="A1" start="0" duration="q" /><note pitch="A1" start="1" duration="q" />
      <note pitch="A1" start="2" duration="q" /><note pitch="G1" start="3" duration="q" />
    </track>
    <track instrument="lead" name="Leads">
      <note pitch="A4" start="0" duration="h" /><note pitch="C5" start="2" duration="h" />
    </track>
  </tracks>
</axml>`
};
