export class SessionID {
  constructor(beginString, senderCompID, targetCompID, sessionQualifier = '') {
    this.beginString = beginString;
    this.senderCompID = senderCompID;
    this.targetCompID = targetCompID;
    this.sessionQualifier = sessionQualifier;
  }

  getBeginString() {
    return this.beginString;
  }

  getSenderCompID() {
    return this.senderCompID;
  }

  getTargetCompID() {
    return this.targetCompID;
  }

  getSessionQualifier() {
    return this.sessionQualifier;
  }

  toString() {
    let str = `${this.beginString}:${this.senderCompID}->${this.targetCompID}`;
    if (this.sessionQualifier) {
      str += `:${this.sessionQualifier}`;
    }
    return str;
  }

  equals(other) {
    if (!other || !(other instanceof SessionID)) {
      return false;
    }
    return this.beginString === other.beginString &&
           this.senderCompID === other.senderCompID &&
           this.targetCompID === other.targetCompID &&
           this.sessionQualifier === other.sessionQualifier;
  }

  static fromString(str) {
    const parts = str.split(':');
    if (parts.length < 2) {
      throw new Error(`Invalid SessionID string: ${str}`);
    }
    
    const beginString = parts[0];
    const compIDs = parts[1].split('->');
    if (compIDs.length !== 2) {
      throw new Error(`Invalid SessionID string: ${str}`);
    }
    
    const senderCompID = compIDs[0];
    const targetCompID = compIDs[1];
    const sessionQualifier = parts[2] || '';
    
    return new SessionID(beginString, senderCompID, targetCompID, sessionQualifier);
  }
}

export default SessionID;
