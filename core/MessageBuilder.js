import Message from './Message.js';
import Field from './Field.js';

export class MessageBuilder {
  constructor(dataDictionary = null) {
    this.dataDictionary = dataDictionary;
  }

  build(message) {
    const parts = [];
    const bodyParts = [];

    message.getFields().forEach(field => {
      bodyParts.push(`${field.getTag()}=${field.getValue()}`);
    });

    message.getHeader().getFields()
      .filter(f => f.getTag() !== 8 && f.getTag() !== 9)
      .forEach(field => {
        bodyParts.push(`${field.getTag()}=${field.getValue()}`);
      });

    const body = bodyParts.join(Field.SOH);
    const bodyLength = body.length;

    parts.push(`8=${message.getBeginString() || 'FIX.4.2'}`);
    parts.push(`9=${bodyLength}`);
    parts.push(body);

    const messageWithoutChecksum = parts.join(Field.SOH) + Field.SOH;
    const checksum = this.calculateChecksum(messageWithoutChecksum);

    parts.push(`10=${checksum}`);

    return parts.join(Field.SOH) + Field.SOH;
  }

  calculateChecksum(message) {
    let sum = 0;
    for (let i = 0; i < message.length; i++) {
      sum += message.charCodeAt(i);
    }
    const checksum = (sum % 256).toString().padStart(3, '0');
    return checksum;
  }

  buildLogon(sessionID, heartbeatInterval = 30) {
    const message = new Message();
    message.setBeginString(sessionID.getBeginString());
    message.setMsgType('A');
    message.setSenderCompID(sessionID.getSenderCompID());
    message.setTargetCompID(sessionID.getTargetCompID());
    message.setField(98, '0');
    message.setField(108, heartbeatInterval.toString());
    
    return message;
  }

  buildLogout(sessionID, text = '') {
    const message = new Message();
    message.setBeginString(sessionID.getBeginString());
    message.setMsgType('5');
    message.setSenderCompID(sessionID.getSenderCompID());
    message.setTargetCompID(sessionID.getTargetCompID());
    
    if (text) {
      message.setField(58, text);
    }
    
    return message;
  }

  buildHeartbeat(sessionID, testReqID = null) {
    const message = new Message();
    message.setBeginString(sessionID.getBeginString());
    message.setMsgType('0');
    message.setSenderCompID(sessionID.getSenderCompID());
    message.setTargetCompID(sessionID.getTargetCompID());
    
    if (testReqID) {
      message.setField(112, testReqID);
    }
    
    return message;
  }

  buildTestRequest(sessionID, testReqID) {
    const message = new Message();
    message.setBeginString(sessionID.getBeginString());
    message.setMsgType('1');
    message.setSenderCompID(sessionID.getSenderCompID());
    message.setTargetCompID(sessionID.getTargetCompID());
    message.setField(112, testReqID);
    
    return message;
  }

  buildResendRequest(sessionID, beginSeqNo, endSeqNo = 0) {
    const message = new Message();
    message.setBeginString(sessionID.getBeginString());
    message.setMsgType('2');
    message.setSenderCompID(sessionID.getSenderCompID());
    message.setTargetCompID(sessionID.getTargetCompID());
    message.setField(7, beginSeqNo.toString());
    message.setField(16, endSeqNo.toString());
    
    return message;
  }

  buildSequenceReset(sessionID, newSeqNo, gapFillFlag = false) {
    const message = new Message();
    message.setBeginString(sessionID.getBeginString());
    message.setMsgType('4');
    message.setSenderCompID(sessionID.getSenderCompID());
    message.setTargetCompID(sessionID.getTargetCompID());
    message.setField(36, newSeqNo.toString());
    
    if (gapFillFlag) {
      message.setField(123, 'Y');
    }
    
    return message;
  }
}

export default MessageBuilder;
