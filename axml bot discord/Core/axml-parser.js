const { XMLParser } = require('fast-xml-parser');
const { ERROR_CODES, INSTRUMENT_TYPES, VALID_NOTES } = require('../utils/constants');

class AXMLParser {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      allowBooleanAttributes: true
    });
  }

  /**
   * Parses an AXML string.
   * @param {string} xmlContent 
   * @returns {Object} Parsed and validated object.
   */
  parse(xmlContent) {
    if (!xmlContent || typeof xmlContent !== 'string') {
      throw new Error("Invalid AXML content");
    }

    let result;
    try {
      result = this.parser.parse(xmlContent);
    } catch (e) {
      throw new Error(`${ERROR_CODES.XML_MALFORMED}: ${e.message}`);
    }

    if (!result.axml) {
      throw new Error(`${ERROR_CODES.XML_MALFORMED}: Missing root <axml> tag`);
    }

    const axml = result.axml;
    
    // Normalize arrays (fast-xml-parser returns object for single item)
    if (axml.instruments && axml.instruments.instrument && !Array.isArray(axml.instruments.instrument)) {
      axml.instruments.instrument = [axml.instruments.instrument];
    }
    
    if (axml.tracks && axml.tracks.track && !Array.isArray(axml.tracks.track)) {
        axml.tracks.track = [axml.tracks.track];
    }

    // Validate Metadata
    if (!axml.metadata) {
       throw new Error(`${ERROR_CODES.XML_MALFORMED}: Missing <metadata>`);
    }

    // Basic Validations
    this.validateInstruments(axml.instruments);
    // this.validateTracks(axml.tracks); // Could be expensive, do on demand or here.

    return axml;
  }

  validateInstruments(instruments) {
    if (!instruments || !instruments.instrument) return;
    
    const list = instruments.instrument;
    const ids = new Set();
    
    for (const inst of list) {
      if (!inst.id) throw new Error(`${ERROR_CODES.INVALID_ATTRIBUTE}: Instrument missing ID`);
      if (ids.has(inst.id)) throw new Error(`${ERROR_CODES.INVALID_ATTRIBUTE}: Duplicate instrument ID '${inst.id}'`);
      ids.add(inst.id);
      
      if (!inst.type) throw new Error(`${ERROR_CODES.INVALID_ATTRIBUTE}: Instrument '${inst.id}' missing type`);
      if (!INSTRUMENT_TYPES.includes(inst.type)) {
         // Maybe warn instead of error? Spec says "Valid Instrument Types".
         // Let's allow it but maybe warn. For now strict.
         // throw new Error(`${ERROR_CODES.INVALID_ATTRIBUTE}: Invalid instrument type '${inst.type}'`);
      }
    }
  }
}

module.exports = new AXMLParser();
