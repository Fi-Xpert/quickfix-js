import ConsoleLog from './ConsoleLog.js';
import FileLog from './FileLog.js';

export class LogFactory {
  create(sessionID, settings) {
    throw new Error('Method not implemented');
  }
}

export class ConsoleLogFactory extends LogFactory {
  create(sessionID, settings) {
    return new ConsoleLog(sessionID);
  }
}

export class FileLogFactory extends LogFactory {
  constructor(logPath = './logs') {
    super();
    this.logPath = logPath;
  }

  create(sessionID, settings) {
    const logPath = settings?.get(sessionID, 'FileLogPath') || this.logPath;
    return new FileLog(sessionID, logPath);
  }
}

export { ConsoleLog, FileLog };
export default LogFactory;
