import Log from './Log.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export class FileLog extends Log {
  constructor(sessionID, logPath = './logs') {
    super();
    this.sessionID = sessionID;
    this.logPath = logPath;
    this.sessionKey = sessionID.toString().replace(/[^a-zA-Z0-9]/g, '_');
    this.logFile = join(this.logPath, `${this.sessionKey}.log`);
    this.eventLogFile = join(this.logPath, `${this.sessionKey}.event.log`);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.logPath, { recursive: true });
    } catch (e) {
    }
    
    this.initialized = true;
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  async writeLog(file, message) {
    if (!this.initialized) await this.initialize();
    
    try {
      await fs.appendFile(file, message + '\n', 'utf8');
    } catch (e) {
      console.error(`Failed to write to log file: ${e.message}`);
    }
  }

  onIncoming(message) {
    const logLine = `${this.getTimestamp()} <-- IN: ${message}`;
    this.writeLog(this.logFile, logLine);
  }

  onOutgoing(message) {
    const logLine = `${this.getTimestamp()} --> OUT: ${message}`;
    this.writeLog(this.logFile, logLine);
  }

  onEvent(text) {
    const logLine = `${this.getTimestamp()} EVENT: ${text}`;
    this.writeLog(this.eventLogFile, logLine);
  }

  async clear() {
    try {
      await fs.unlink(this.logFile);
    } catch (e) {
    }
    
    try {
      await fs.unlink(this.eventLogFile);
    } catch (e) {
    }
  }
}

export default FileLog;
