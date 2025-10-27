import { readFileSync } from 'fs';
import SessionID from './SessionID.js';

export class SessionSettings {
  constructor(configPath = null) {
    this.defaultSettings = new Map();
    this.sessionSettings = new Map();
    
    if (configPath) {
      this.load(configPath);
    }
  }

  load(configPath) {
    const content = readFileSync(configPath, 'utf8');
    
    if (configPath.endsWith('.json')) {
      this.loadJSON(content);
    } else {
      this.loadINI(content);
    }
  }

  loadJSON(content) {
    const config = JSON.parse(content);
    
    if (config.default) {
      Object.entries(config.default).forEach(([key, value]) => {
        this.defaultSettings.set(key, value);
      });
    }
    
    if (config.sessions) {
      config.sessions.forEach(sessionConfig => {
        const sessionID = new SessionID(
          sessionConfig.BeginString,
          sessionConfig.SenderCompID,
          sessionConfig.TargetCompID,
          sessionConfig.SessionQualifier || ''
        );
        
        const settings = new Map(this.defaultSettings);
        Object.entries(sessionConfig).forEach(([key, value]) => {
          settings.set(key, value);
        });
        
        this.sessionSettings.set(sessionID.toString(), { sessionID, settings });
      });
    }
  }

  loadINI(content) {
    const lines = content.split('\n');
    let currentSection = null;
    let currentSettings = null;
    
    for (let line of lines) {
      line = line.trim();
      
      if (!line || line.startsWith('#') || line.startsWith(';')) {
        continue;
      }
      
      if (line.startsWith('[') && line.endsWith(']')) {
        if (currentSection === 'SESSION' && currentSettings) {
          this.addSession(currentSettings);
        }
        
        currentSection = line.substring(1, line.length - 1).toUpperCase();
        currentSettings = new Map(this.defaultSettings);
        continue;
      }
      
      const equalPos = line.indexOf('=');
      if (equalPos === -1) {
        continue;
      }
      
      const key = line.substring(0, equalPos).trim();
      const value = line.substring(equalPos + 1).trim();
      
      if (currentSection === 'DEFAULT') {
        this.defaultSettings.set(key, value);
        currentSettings.set(key, value);
      } else if (currentSection === 'SESSION') {
        currentSettings.set(key, value);
      }
    }
    
    if (currentSection === 'SESSION' && currentSettings) {
      this.addSession(currentSettings);
    }
  }

  addSession(settings) {
    const beginString = settings.get('BeginString');
    const senderCompID = settings.get('SenderCompID');
    const targetCompID = settings.get('TargetCompID');
    const sessionQualifier = settings.get('SessionQualifier') || '';
    
    if (!beginString || !senderCompID || !targetCompID) {
      throw new Error('Session must have BeginString, SenderCompID, and TargetCompID');
    }
    
    const sessionID = new SessionID(beginString, senderCompID, targetCompID, sessionQualifier);
    this.sessionSettings.set(sessionID.toString(), { sessionID, settings });
  }

  get(sessionID, key) {
    const sessionKey = sessionID.toString();
    const session = this.sessionSettings.get(sessionKey);
    
    if (session && session.settings.has(key)) {
      return session.settings.get(key);
    }
    
    return this.defaultSettings.get(key);
  }

  set(sessionID, key, value) {
    const sessionKey = sessionID.toString();
    const session = this.sessionSettings.get(sessionKey);
    
    if (session) {
      session.settings.set(key, value);
    }
  }

  has(sessionID, key) {
    const sessionKey = sessionID.toString();
    const session = this.sessionSettings.get(sessionKey);
    
    return (session && session.settings.has(key)) || this.defaultSettings.has(key);
  }

  getSessions() {
    return Array.from(this.sessionSettings.values()).map(s => s.sessionID);
  }

  getSessionSettings(sessionID) {
    const sessionKey = sessionID.toString();
    const session = this.sessionSettings.get(sessionKey);
    return session ? session.settings : new Map();
  }

  getString(sessionID, key, defaultValue = null) {
    const value = this.get(sessionID, key);
    return value !== undefined ? value : defaultValue;
  }

  getInt(sessionID, key, defaultValue = null) {
    const value = this.get(sessionID, key);
    return value !== undefined ? parseInt(value) : defaultValue;
  }

  getBool(sessionID, key, defaultValue = false) {
    const value = this.get(sessionID, key);
    if (value === undefined) return defaultValue;
    
    const lowerValue = value.toString().toLowerCase();
    return lowerValue === 'true' || lowerValue === 'y' || lowerValue === 'yes' || lowerValue === '1';
  }
}

export default SessionSettings;
