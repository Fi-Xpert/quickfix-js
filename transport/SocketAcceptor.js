import { createServer } from 'net';
import { EventEmitter } from 'events';
import Session from '../core/Session.js';
import SessionID from '../core/SessionID.js';

export class SocketAcceptor extends EventEmitter {
  constructor(application, storeFactory, settings, logFactory) {
    super();
    this.application = application;
    this.storeFactory = storeFactory;
    this.settings = settings;
    this.logFactory = logFactory;
    this.sessions = new Map();
    this.server = null;
    this.running = false;
  }

  async start() {
    if (this.running) {
      return;
    }

    const sessionIDs = this.settings.getSessions();
    
    for (const sessionID of sessionIDs) {
      const connectionType = this.settings.getString(sessionID, 'ConnectionType', 'initiator');
      
      if (connectionType.toLowerCase() === 'acceptor') {
        await this.createSession(sessionID);
      }
    }

    const firstSessionID = sessionIDs[0];
    const port = this.settings.getInt(firstSessionID, 'SocketAcceptPort', 5001);
    const host = this.settings.getString(firstSessionID, 'SocketAcceptHost', '0.0.0.0');

    this.server = createServer((socket) => {
      this.handleConnection(socket);
    });

    this.server.listen(port, host, () => {
      console.log(`FIX Acceptor listening on ${host}:${port}`);
      this.running = true;
      this.emit('start');
    });

    this.server.on('error', (error) => {
      console.error('Acceptor error:', error);
      this.emit('error', error);
    });
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
    
    this.sessions.set(sessionID.toString(), session);
    
    return session;
  }

  handleConnection(socket) {
    console.log('New connection from', socket.remoteAddress);
    
    let currentSession = null;
    let buffer = Buffer.alloc(0);

    socket.on('data', async (data) => {
      buffer = Buffer.concat([buffer, data]);
      
      if (!currentSession) {
        const sessionID = this.identifySession(buffer);
        
        if (sessionID) {
          const sessionKey = sessionID.toString();
          currentSession = this.sessions.get(sessionKey);
          
          if (currentSession) {
            currentSession.setSocket(socket);
            console.log('Session identified:', sessionKey);
          } else {
            console.log('Unknown session:', sessionKey);
            socket.end();
            return;
          }
        }
      }
      
      if (currentSession) {
        await currentSession.onData(data);
      }
    });

    socket.on('end', () => {
      console.log('Connection closed');
      if (currentSession) {
        currentSession.disconnect();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error.message);
      if (currentSession) {
        currentSession.disconnect();
      }
    });
  }

  identifySession(buffer) {
    try {
      const str = buffer.toString('utf8');
      const parts = str.split('\x01');
      
      let beginString = null;
      let senderCompID = null;
      let targetCompID = null;
      
      for (const part of parts) {
        if (part.startsWith('8=')) {
          beginString = part.substring(2);
        } else if (part.startsWith('49=')) {
          senderCompID = part.substring(3);
        } else if (part.startsWith('56=')) {
          targetCompID = part.substring(3);
        }
      }
      
      if (beginString && senderCompID && targetCompID) {
        return new SessionID(beginString, targetCompID, senderCompID);
      }
    } catch (e) {
    }
    
    return null;
  }

  getSession(sessionID) {
    return this.sessions.get(sessionID.toString());
  }

  getSessions() {
    return Array.from(this.sessions.values());
  }

  async stop() {
    this.running = false;
    
    for (const session of this.sessions.values()) {
      if (session.isLoggedOn()) {
        await session.logout();
      }
      session.disconnect();
    }
    
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    
    this.emit('stop');
  }
}

export default SocketAcceptor;
