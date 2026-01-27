/**
 * Simple Test Suite for AXML Engine
 */

async function runTests() {
    console.log("🧪 Starting AXML Tests...");

    try {
        const parser = new AXMLParser();

        // Test 1: Basic Parsing
        const xml = `
        <axml version="1.0">
            <metadata><title>Test</title><artist>Tester</artist><tempo>120</tempo></metadata>
            <instruments><instrument id="i1" type="sine" /></instruments>
            <tracks><track instrument="i1"><note pitch="C4" duration="1" /></track></tracks>
        </axml>`;

        const data = parser.parse(xml);
        if (data.metadata.title === "Test") {
            console.log("✅ Test 1: Parser basics passed");
        } else {
            throw new Error("Metadata title mismatch");
        }

        // Test 2: Frequency Calculation
        const freq = getFrequency("A4");
        if (Math.round(freq) === 440) {
            console.log("✅ Test 2: Frequency logic (A4 = 440Hz) passed");
        } else {
            throw new Error(`Frequency mismatch: expected 440, got ${freq}`);
        }

        console.log("🎉 All tests passed!");
    } catch (e) {
        console.error("❌ Test failed:", e.message);
    }
}

// Uncomment to run in browser console
// runTests();
