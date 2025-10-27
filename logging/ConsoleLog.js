import Log from './Log.js';

export class ConsoleLog extends Log {
  constructor(sessionID) {
    super();
    this.sessionID = sessionID;
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  onIncoming(message) {
    console.log(`[${this.getTimestamp()}] [${this.sessionID.toString()}] <-- IN: ${message}`);
  }

  onOutgoing(message) {
    console.log(`[${this.getTimestamp()}] [${this.sessionID.toString()}] --> OUT: ${message}`);
  }

  onEvent(text) {
    console.log(`[${this.getTimestamp()}] [${this.sessionID.toString()}] EVENT: ${text}`);
  }
}

export default ConsoleLog;
