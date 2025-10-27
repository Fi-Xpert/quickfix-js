import MessageBuilder from './MessageBuilder.js';
import MessageParser from './MessageParser.js';
import { EventEmitter } from 'events';

export class Session extends EventEmitter {
  constructor(sessionID, store, log, application, heartbeatInterval = 30) {
    super();
    this.sessionID = sessionID;
    this.store = store;
    this.log = log;
    this.application = application;
    this.heartbeatInterval = heartbeatInterval;
    this.messageBuilder = new MessageBuilder();
    this.messageParser = new MessageParser();
    
    this.connected = false;
    this.loggedOn = false;
    this.socket = null;
    this.heartbeatTimer = null;
    this.testRequestTimer = null;
    this.testRequestID = null;
    this.lastReceivedTime = Date.now();
    this.lastSentTime = Date.now();
    this.resetRequested = false;
    
    this.buffer = Buffer.alloc(0);
  }

  async initialize() {
    if (this.store && typeof this.store.initialize === 'function') {
      await this.store.initialize();
    }
    
    if (this.log && typeof this.log.initialize === 'function') {
      await this.log.initialize();
    }
  }

  setSocket(socket) {
    this.socket = socket;
    this.connected = true;
  }

  getSessionID() {
    return this.sessionID;
  }

  isLoggedOn() {
    return this.loggedOn;
  }

  isConnected() {
    return this.connected;
  }

  async logon() {
    const message = this.messageBuilder.buildLogon(this.sessionID, this.heartbeatInterval);
    await this.send(message, true);
  }

  async logout(text = '') {
    const message = this.messageBuilder.buildLogout(this.sessionID, text);
    await this.send(message, true);
    this.loggedOn = false;
  }

  async send(message, isAdmin = false) {
    const seqNum = await this.store.getNextSenderMsgSeqNum();
    message.setMsgSeqNum(seqNum);
    
    const now = new Date();
    const sendingTime = now.toISOString().replace(/[-:.]/g, '').substring(0, 17);
    message.getHeader().setField(52, sendingTime);
    
    if (this.application) {
      try {
        if (isAdmin) {
          this.application.toAdmin(message, this.sessionID);
        } else {
          this.application.toApp(message, this.sessionID);
        }
      } catch (e) {
        this.log?.onEvent(`Error in application callback: ${e.message}`);
      }
    }
    
    const rawMessage = this.messageBuilder.build(message);
    
    this.log?.onOutgoing(rawMessage);
    
    if (this.socket && this.socket.writable) {
      this.socket.write(rawMessage);
    }
    
    await this.store.incrNextSenderMsgSeqNum();
    await this.store.storeMessage(seqNum, rawMessage);
    
    this.lastSentTime = Date.now();
    
    return true;
  }

  async onData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);
    
    const rawMessages = this.messageParser.extractRawMessage(this.buffer);
    
    if (rawMessages.length > 0) {
      const lastMessage = rawMessages[rawMessages.length - 1];
      const lastIndex = this.buffer.toString('utf8').indexOf(lastMessage) + lastMessage.length;
      this.buffer = this.buffer.slice(lastIndex);
    }
    
    for (const rawMessage of rawMessages) {
      await this.processMessage(rawMessage);
    }
  }

  async processMessage(rawMessage) {
    this.log?.onIncoming(rawMessage);
    this.lastReceivedTime = Date.now();
    
    try {
      const message = this.messageParser.parse(rawMessage);
      
      const msgSeqNum = message.getMsgSeqNum();
      const expectedSeqNum = await this.store.getNextTargetMsgSeqNum();
      
      if (msgSeqNum > expectedSeqNum) {
        this.log?.onEvent(`Gap detected: expected ${expectedSeqNum}, got ${msgSeqNum}`);
        await this.sendResendRequest(expectedSeqNum, msgSeqNum - 1);
        return;
      } else if (msgSeqNum < expectedSeqNum) {
        this.log?.onEvent(`Duplicate message: expected ${expectedSeqNum}, got ${msgSeqNum}`);
        return;
      }
      
      await this.store.incrNextTargetMsgSeqNum();
      
      const msgType = message.getMsgType();
      
      if (this.isAdminMessage(msgType)) {
        await this.handleAdminMessage(message);
      } else {
        await this.handleAppMessage(message);
      }
      
    } catch (e) {
      this.log?.onEvent(`Error processing message: ${e.message}`);
    }
  }

  isAdminMessage(msgType) {
    return ['0', '1', '2', '3', '4', '5', 'A'].includes(msgType);
  }

  async handleAdminMessage(message) {
    const msgType = message.getMsgType();
    
    if (this.application) {
      try {
        this.application.fromAdmin(message, this.sessionID);
      } catch (e) {
        this.log?.onEvent(`Error in fromAdmin callback: ${e.message}`);
      }
    }
    
    switch (msgType) {
      case 'A':
        await this.handleLogon(message);
        break;
      case '0':
        await this.handleHeartbeat(message);
        break;
      case '1':
        await this.handleTestRequest(message);
        break;
      case '2':
        await this.handleResendRequest(message);
        break;
      case '4':
        await this.handleSequenceReset(message);
        break;
      case '5':
        await this.handleLogout(message);
        break;
    }
  }

  async handleAppMessage(message) {
    if (this.application) {
      try {
        this.application.fromApp(message, this.sessionID);
      } catch (e) {
        this.log?.onEvent(`Error in fromApp callback: ${e.message}`);
      }
    }
    
    this.emit('message', message);
  }

  async handleLogon(message) {
    this.log?.onEvent('Logon received');
    
    if (!this.loggedOn) {
      this.loggedOn = true;
      
      if (this.application) {
        try {
          this.application.onLogon(this.sessionID);
        } catch (e) {
          this.log?.onEvent(`Error in onLogon callback: ${e.message}`);
        }
      }
      
      this.startHeartbeat();
      this.emit('logon');
    }
  }

  async handleLogout(message) {
    this.log?.onEvent('Logout received');
    this.loggedOn = false;
    this.stopHeartbeat();
    
    if (this.application) {
      try {
        this.application.onLogout(this.sessionID);
      } catch (e) {
        this.log?.onEvent(`Error in onLogout callback: ${e.message}`);
      }
    }
    
    this.emit('logout');
  }

  async handleHeartbeat(message) {
    const testReqID = message.hasField(112) ? message.getField(112) : null;
    
    if (testReqID && testReqID === this.testRequestID) {
      this.clearTestRequest();
    }
  }

  async handleTestRequest(message) {
    const testReqID = message.getField(112);
    const heartbeat = this.messageBuilder.buildHeartbeat(this.sessionID, testReqID);
    await this.send(heartbeat, true);
  }

  async handleResendRequest(message) {
    const beginSeqNo = parseInt(message.getField(7));
    const endSeqNo = parseInt(message.getField(16));
    
    this.log?.onEvent(`Resend request: ${beginSeqNo} to ${endSeqNo}`);
    
    const messages = await this.store.getMessages(beginSeqNo, endSeqNo);
    
    for (const msgData of messages) {
      if (this.socket && this.socket.writable) {
        this.socket.write(msgData.message);
      }
    }
  }

  async handleSequenceReset(message) {
    const newSeqNo = parseInt(message.getField(36));
    this.log?.onEvent(`Sequence reset to ${newSeqNo}`);
    await this.store.setNextTargetMsgSeqNum(newSeqNo);
  }

  async sendResendRequest(beginSeqNo, endSeqNo = 0) {
    const message = this.messageBuilder.buildResendRequest(this.sessionID, beginSeqNo, endSeqNo);
    await this.send(message, true);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    
    if (this.heartbeatInterval > 0) {
      this.heartbeatTimer = setInterval(() => {
        this.checkHeartbeat();
      }, this.heartbeatInterval * 1000);
    }
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearTestRequest();
  }

  async checkHeartbeat() {
    const now = Date.now();
    const timeSinceLastSent = (now - this.lastSentTime) / 1000;
    const timeSinceLastReceived = (now - this.lastReceivedTime) / 1000;
    
    if (timeSinceLastSent >= this.heartbeatInterval) {
      const heartbeat = this.messageBuilder.buildHeartbeat(this.sessionID);
      await this.send(heartbeat, true);
    }
    
    if (timeSinceLastReceived >= this.heartbeatInterval * 1.5) {
      if (!this.testRequestTimer) {
        this.sendTestRequest();
      } else {
        this.log?.onEvent('No response to test request - disconnecting');
        this.disconnect();
      }
    }
  }

  async sendTestRequest() {
    this.testRequestID = `TEST_${Date.now()}`;
    const testRequest = this.messageBuilder.buildTestRequest(this.sessionID, this.testRequestID);
    await this.send(testRequest, true);
    
    this.testRequestTimer = setTimeout(() => {
      this.log?.onEvent('Test request timeout - disconnecting');
      this.disconnect();
    }, this.heartbeatInterval * 1000);
  }

  clearTestRequest() {
    if (this.testRequestTimer) {
      clearTimeout(this.testRequestTimer);
      this.testRequestTimer = null;
    }
    this.testRequestID = null;
  }

  disconnect() {
    this.connected = false;
    this.loggedOn = false;
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    
    this.emit('disconnect');
  }

  async reset() {
    await this.store.reset();
    this.loggedOn = false;
    this.resetRequested = false;
  }
}

export default Session;
