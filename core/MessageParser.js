import Message from './Message.js';
import Group from './Group.js';
import Field from './Field.js';

export class MessageParser {
  constructor(dataDictionary = null) {
    this.dataDictionary = dataDictionary;
  }

  parse(rawMessage) {
    if (!rawMessage) {
      throw new Error('Cannot parse empty message');
    }

    const message = new Message();
    const parts = rawMessage.split(Field.SOH).filter(p => p.length > 0);

    for (const part of parts) {
      const equalPos = part.indexOf('=');
      if (equalPos === -1) {
        continue;
      }

      const tag = parseInt(part.substring(0, equalPos));
      const value = part.substring(equalPos + 1);

      if (isNaN(tag)) {
        continue;
      }

      if (this.dataDictionary) {
        if (this.dataDictionary.isHeaderField(tag)) {
          message.getHeader().setField(tag, value);
        } else if (this.dataDictionary.isTrailerField(tag)) {
          message.getTrailer().setField(tag, value);
        } else {
          message.setField(tag, value);
        }
      } else {
        if (tag === 8 || tag === 9 || tag === 35 || tag === 49 || tag === 56 || tag === 34 || tag === 52) {
          message.getHeader().setField(tag, value);
        } else if (tag === 10) {
          message.getTrailer().setField(tag, value);
        } else {
          message.setField(tag, value);
        }
      }
    }

    return message;
  }

  extractRawMessage(buffer) {
    const str = buffer.toString('utf8');
    const messages = [];
    let startIdx = 0;

    while (startIdx < str.length) {
      const beginIdx = str.indexOf('8=FIX', startIdx);
      if (beginIdx === -1) {
        break;
      }

      const lengthStart = str.indexOf(Field.SOH + '9=', beginIdx);
      if (lengthStart === -1) {
        break;
      }

      const lengthEnd = str.indexOf(Field.SOH, lengthStart + 1);
      if (lengthEnd === -1) {
        break;
      }

      const bodyLength = parseInt(str.substring(lengthStart + 3, lengthEnd));
      if (isNaN(bodyLength)) {
        startIdx = beginIdx + 1;
        continue;
      }

      const bodyStart = lengthEnd + 1;
      const messageEnd = bodyStart + bodyLength;

      const checksumStart = str.indexOf(Field.SOH + '10=', messageEnd);
      if (checksumStart === -1 || checksumStart > messageEnd + 10) {
        startIdx = beginIdx + 1;
        continue;
      }

      const checksumEnd = str.indexOf(Field.SOH, checksumStart + 1);
      const actualEnd = checksumEnd !== -1 ? checksumEnd + 1 : str.length;

      const rawMessage = str.substring(beginIdx, actualEnd);
      messages.push(rawMessage);

      startIdx = actualEnd;
    }

    return messages;
  }

  validate(message) {
    const errors = [];

    if (!message.getHeader().hasField(8)) {
      errors.push('Missing BeginString (tag 8)');
    }

    if (!message.getHeader().hasField(9)) {
      errors.push('Missing BodyLength (tag 9)');
    }

    if (!message.getHeader().hasField(35)) {
      errors.push('Missing MsgType (tag 35)');
    }

    if (!message.getTrailer().hasField(10)) {
      errors.push('Missing CheckSum (tag 10)');
    }

    if (this.dataDictionary && message.getMsgType()) {
      const msgType = message.getMsgType();
      const messageFields = this.dataDictionary.getMessageFields(msgType);

      messageFields.forEach(fieldDef => {
        if (fieldDef.required && !message.hasField(parseInt(fieldDef.tag))) {
          errors.push(`Missing required field ${fieldDef.name} (tag ${fieldDef.tag})`);
        }
      });
    }

    return errors;
  }
}

export default MessageParser;
