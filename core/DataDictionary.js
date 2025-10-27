import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DataDictionary {
  constructor(fixVersion) {
    this.fixVersion = fixVersion;
    this.fields = new Map();
    this.messages = new Map();
    this.fieldsByName = new Map();
    this.messagesByName = new Map();
    this.headerFields = new Set();
    this.trailerFields = new Set();
  }

  load(dictionaryPath = null) {
    if (!dictionaryPath) {
      dictionaryPath = this.getDefaultDictionaryPath(this.fixVersion);
    }

    try {
      const data = JSON.parse(readFileSync(dictionaryPath, 'utf8'));
      this.loadFromJSON(data);
    } catch (error) {
      throw new Error(`Failed to load dictionary from ${dictionaryPath}: ${error.message}`);
    }
  }

  getDefaultDictionaryPath(fixVersion) {
    const versionMap = {
      'FIX.4.0': 'FIX40.json',
      'FIX.4.2': 'FIX42.json',
      'FIX.4.4': 'FIX44.json',
      'FIX.5.0': 'FIX50.json',
      'FIX.5.0SP2': 'FIX50SP2.json',
      'FIXT.1.1': 'FIXT11.json'
    };

    const filename = versionMap[fixVersion];
    if (!filename) {
      throw new Error(`Unsupported FIX version: ${fixVersion}`);
    }

    return join(__dirname, '..', 'fix', 'data', filename);
  }

  loadFromJSON(data) {
    if (data.header) {
      data.header.forEach(tag => this.headerFields.add(parseInt(tag)));
    }

    if (data.trailer) {
      data.trailer.forEach(tag => this.trailerFields.add(parseInt(tag)));
    }

    if (data.fields) {
      data.fields.forEach(field => {
        const tag = parseInt(field.tag);
        this.fields.set(tag, field);
        this.fieldsByName.set(field.name, field);
      });
    }

    if (data.messages) {
      data.messages.forEach(message => {
        this.messages.set(message.msgtype, message);
        this.messagesByName.set(message.name, message);
      });
    }
  }

  getField(tag) {
    return this.fields.get(parseInt(tag));
  }

  getFieldByName(name) {
    return this.fieldsByName.get(name);
  }

  getMessage(msgType) {
    return this.messages.get(msgType);
  }

  getMessageByName(name) {
    return this.messagesByName.get(name);
  }

  isHeaderField(tag) {
    return this.headerFields.has(parseInt(tag));
  }

  isTrailerField(tag) {
    return this.trailerFields.has(parseInt(tag));
  }

  isRequiredField(msgType, tag) {
    const message = this.getMessage(msgType);
    if (!message || !message.fields) {
      return false;
    }

    const field = message.fields.find(f => parseInt(f.tag) === parseInt(tag));
    return field && field.required === true;
  }

  getFieldType(tag) {
    const field = this.getField(tag);
    return field ? field.type : null;
  }

  getFieldName(tag) {
    const field = this.getField(tag);
    return field ? field.name : null;
  }

  getTagByName(name) {
    const field = this.getFieldByName(name);
    return field ? parseInt(field.tag) : null;
  }

  getMessageFields(msgType) {
    const message = this.getMessage(msgType);
    return message ? message.fields || [] : [];
  }

  getMessageName(msgType) {
    const message = this.getMessage(msgType);
    return message ? message.name : null;
  }
}

export default DataDictionary;
