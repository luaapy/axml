const { createCanvas } = require('@napi-rs/canvas');
const { XMLParser } = require('fast-xml-parser');
const fs = require('node:fs');

async function renderAXMLScore(axmlPath) {
    const xmlData = fs.readFileSync(axmlPath, 'utf-8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlData);

    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, 800, 400);

    // Draw Staff Lines (SVG style)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        const y = 50 + i * 30;
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(750, y);
        ctx.stroke();
    }

    // Parse notes and draw them
    const tracks = Array.isArray(jsonObj.axml.tracks.track) ? jsonObj.axml.tracks.track : [jsonObj.axml.tracks.track];

    ctx.fillStyle = '#00ff88';
    tracks.forEach((track, tIdx) => {
        const notes = Array.isArray(track.note) ? track.note : (track.note ? [track.note] : []);
        let xOffset = 60;

        notes.forEach((note, nIdx) => {
            const pitch = note.pitch || 'C4';
            const octave = parseInt(pitch.slice(-1)) || 4;
            const y = 300 - (octave * 30) - (Math.random() * 10); // Simple visualization mapping

            // Draw note as a premium SVG-like dot
            ctx.beginPath();
            ctx.arc(xOffset, y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Add a "stem"
            ctx.strokeStyle = '#00ff88';
            ctx.beginPath();
            ctx.moveTo(xOffset + 5, y);
            ctx.lineTo(xOffset + 5, y - 20);
            ctx.stroke();

            xOffset += 40;
        });
    });

    // Add Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(jsonObj.axml.metadata.title || 'AXML Score', 50, 40);

    return canvas.toBuffer('image/png');
}

module.exports = { renderAXMLScore };
