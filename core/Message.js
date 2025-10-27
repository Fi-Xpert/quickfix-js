import FieldMap from './FieldMap.js';
import Field from './Field.js';

export class Message extends FieldMap {
  constructor() {
    super();
    this.header = new FieldMap();
    this.trailer = new FieldMap();
  }

  getHeader() {
    return this.header;
  }

  getTrailer() {
    return this.trailer;
  }

  getMsgType() {
    try {
      return this.header.getField(35);
    } catch (e) {
      return null;
    }
  }

  setMsgType(msgType) {
    this.header.setField(35, msgType);
  }

  getBeginString() {
    try {
      return this.header.getField(8);
    } catch (e) {
      return null;
    }
  }

  setBeginString(beginString) {
    this.header.setField(8, beginString);
  }

  getSenderCompID() {
    try {
      return this.header.getField(49);
    } catch (e) {
      return null;
    }
  }

  setSenderCompID(senderCompID) {
    this.header.setField(49, senderCompID);
  }

  getTargetCompID() {
    try {
      return this.header.getField(56);
    } catch (e) {
      return null;
    }
  }

  setTargetCompID(targetCompID) {
    this.header.setField(56, targetCompID);
  }

  getMsgSeqNum() {
    try {
      return parseInt(this.header.getField(34));
    } catch (e) {
      return null;
    }
  }

  setMsgSeqNum(seqNum) {
    this.header.setField(34, seqNum.toString());
  }

  toString() {
    const parts = [];
    
    this.header.getFields().forEach(field => {
      parts.push(field.toString());
    });
    
    this.getFields().forEach(field => {
      parts.push(field.toString());
    });
    
    this.trailer.getFields().forEach(field => {
      parts.push(field.toString());
    });
    
    return parts.join(Field.SOH);
  }
}

export default Message;
