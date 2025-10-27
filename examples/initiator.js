import { SocketInitiator } from '../transport/SocketInitiator.js';
import { Application } from '../core/Application.js';
import { SessionSettings } from '../core/SessionSettings.js';
import { FileStoreFactory } from '../store/StoreFactory.js';
import { ConsoleLogFactory } from '../logging/LogFactory.js';
import { Message } from '../core/Message.js';

class MyApplication extends Application {
  onCreate(sessionID) {
    console.log('Session created:', sessionID.toString());
  }

  onLogon(sessionID) {
    console.log('Logon successful:', sessionID.toString());
  }

  onLogout(sessionID) {
    console.log('Logout:', sessionID.toString());
  }

  fromApp(message, sessionID) {
    console.log('Application message received:', message.getMsgType());
    console.log('Message content:', message.toString());
  }

  toApp(message, sessionID) {
    console.log('Sending application message:', message.getMsgType());
  }

  fromAdmin(message, sessionID) {
    console.log('Admin message received:', message.getMsgType());
  }

  toAdmin(message, sessionID) {
  }
}

async function main() {
  try {
    const settings = new SessionSettings('./examples/initiator.cfg');
    const storeFactory = new FileStoreFactory();
    const logFactory = new ConsoleLogFactory();
    const application = new MyApplication();

    const initiator = new SocketInitiator(application, storeFactory, settings, logFactory);

    await initiator.start();

    console.log('FIX Initiator started successfully');
    console.log('Press Ctrl+C to stop');

    process.on('SIGINT', async () => {
      console.log('\nStopping initiator...');
      await initiator.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error starting initiator:', error);
    process.exit(1);
  }
}

main();
