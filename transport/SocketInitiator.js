import { connect } from 'net';
import { EventEmitter } from 'events';
import Session from '../core/Session.js';

export class SocketInitiator extends EventEmitter {
  constructor(application, storeFactory, settings, logFactory) {
    super();
    this.application = application;
    this.storeFactory = storeFactory;
    this.settings = settings;
    this.logFactory = logFactory;
    this.sessions = new Map();
    this.reconnectTimers = new Map();
    this.running = false;
  }

  async start() {
    if (this.running) {
      return;
    }

    this.running = true;
    const sessionIDs = this.settings.getSessions();
    
    for (const sessionID of sessionIDs) {
      const connectionType = this.settings.getString(sessionID, 'ConnectionType', 'initiator');
      
      if (connectionType.toLowerCase() === 'initiator') {
        await this.createSession(sessionID);
        await this.connect(sessionID);
      }
    }
    
    this.emit('start');
  }

  async createSession(sessionID) {
    const store = this.storeFactory.create(sessionID, this.settings);
    const log = this.logFactory.create(sessionID, this.settings);
    const heartbeatInterval = this.settings.getInt(sessionID, 'HeartBtInt', 30);
    
    const session = new Session(sessionID, store, log, this.application, heartbeatInterval);
    await session.initialize();
    
    if (this.application && this.application.onCreate) {
      try {
        this.application.onCreate(sessionID);
      } catch (e) {
        log?.onEvent(`Error in onCreate callback: ${e.message}`);
      }
    }
    
    session.on('disconnect', () => {
      if (this.running) {
        this.scheduleReconnect(sessionID);
      }
    });
    
    this.sessions.set(sessionID.toString(), session);
    
    return session;
  }

  async connect(sessionID) {
    const sessionKey = sessionID.toString();
    const session = this.sessions.get(sessionKey);
    
    if (!session) {
      console.error('Session not found:', sessionKey);
      return;
    }

    const host = this.settings.getString(sessionID, 'SocketConnectHost', 'localhost');
    const port = this.settings.getInt(sessionID, 'SocketConnectPort', 5001);
    const reconnectInterval = this.settings.getInt(sessionID, 'ReconnectInterval', 30);

    console.log(`Connecting to ${host}:${port}...`);

    const socket = connect(port, host);

    socket.on('connect', async () => {
      console.log(`Connected to ${host}:${port}`);
      session.setSocket(socket);
      
      const resetOnLogon = this.settings.getBool(sessionID, 'ResetOnLogon', false);
      if (resetOnLogon) {
        await session.reset();
      }
      
      await session.logon();
      this.emit('connect', sessionID);
    });

    socket.on('data', async (data) => {
      await session.onData(data);
    });

    socket.on('end', () => {
      console.log('Connection closed');
      session.disconnect();
    });

    socket.on('error', (error) => {
      console.error(`Connection error: ${error.message}`);
      session.disconnect();
    });
  }

  scheduleReconnect(sessionID) {
    const sessionKey = sessionID.toString();
    const reconnectInterval = this.settings.getInt(sessionID, 'ReconnectInterval', 30);
    
    if (this.reconnectTimers.has(sessionKey)) {
      return;
    }
    
    console.log(`Reconnecting in ${reconnectInterval} seconds...`);
    
    const timer = setTimeout(() => {
      this.reconnectTimers.delete(sessionKey);
      if (this.running) {
        this.connect(sessionID);
      }
    }, reconnectInterval * 1000);
    
    this.reconnectTimers.set(sessionKey, timer);
  }

  getSession(sessionID) {
    return this.sessions.get(sessionID.toString());
  }

  getSessions() {
    return Array.from(this.sessions.values());
  }

  async stop() {
    this.running = false;
    
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
    
    for (const session of this.sessions.values()) {
      if (session.isLoggedOn()) {
        await session.logout();
      }
      session.disconnect();
    }
    
    this.emit('stop');
  }
}

export default SocketInitiator;
