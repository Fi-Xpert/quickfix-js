# QuickFIX-JS

A complete Node.js FIX protocol engine library that replicates QuickFIX/J functionality with session management, message parsing, and multi-version FIX support.

## Features

- **Complete FIX Protocol Support**: Implements FIX versions 4.0, 4.2, 4.4, 5.0, and FIXT1.1
- **Session Management**: Full session lifecycle with logon/logout, heartbeats, test requests, and sequence number tracking
- **Message Parsing & Building**: Convert between raw FIX messages and JavaScript objects
- **Pluggable Storage**: File-based and in-memory message stores
- **Flexible Logging**: Console and file logging with pluggable architecture
- **Transport Layer**: TCP-based SocketInitiator and SocketAcceptor
- **Configuration**: QuickFIX-style .cfg file support
- **Application Callbacks**: Hook into session events and message flows

## Installation

```bash
npm install quickfix-js
```

Or clone this repository:

```bash
git clone <repository-url>
cd quickfix-js
```

## Quick Start

### Running the Simple Test

```bash
node examples/simple-test.js
```

### Creating a FIX Acceptor (Server)

```javascript
import { SocketAcceptor } from 'quickfix-js';
import { Application } from 'quickfix-js';
import { SessionSettings } from 'quickfix-js';
import { FileStoreFactory } from 'quickfix-js';
import { ConsoleLogFactory } from 'quickfix-js';

class MyApplication extends Application {
  onLogon(sessionID) {
    console.log('Client logged on:', sessionID.toString());
  }

  fromApp(message, sessionID) {
    console.log('Received:', message.getMsgType());
  }
}

const settings = new SessionSettings('./acceptor.cfg');
const storeFactory = new FileStoreFactory();
const logFactory = new ConsoleLogFactory();
const application = new MyApplication();

const acceptor = new SocketAcceptor(application, storeFactory, settings, logFactory);
await acceptor.start();
```

### Creating a FIX Initiator (Client)

```javascript
import { SocketInitiator } from 'quickfix-js';
import { Application } from 'quickfix-js';
import { SessionSettings } from 'quickfix-js';
import { FileStoreFactory } from 'quickfix-js';
import { ConsoleLogFactory } from 'quickfix-js';

class MyApplication extends Application {
  onLogon(sessionID) {
    console.log('Logged on to server:', sessionID.toString());
  }

  fromApp(message, sessionID) {
    console.log('Received:', message.getMsgType());
  }
}

const settings = new SessionSettings('./initiator.cfg');
const storeFactory = new FileStoreFactory();
const logFactory = new ConsoleLogFactory();
const application = new MyApplication();

const initiator = new SocketInitiator(application, storeFactory, settings, logFactory);
await initiator.start();
```

## Configuration File Format

QuickFIX-JS uses the same configuration format as QuickFIX/J:

```ini
[DEFAULT]
BeginString=FIX.4.2
FileStorePath=./store
FileLogPath=./logs
HeartBtInt=30

[SESSION]
ConnectionType=acceptor
SenderCompID=ACCEPTOR
TargetCompID=INITIATOR
SocketAcceptHost=0.0.0.0
SocketAcceptPort=5001
```

### Configuration Parameters

**Common Settings:**
- `BeginString`: FIX version (FIX.4.0, FIX.4.2, FIX.4.4, FIX.5.0, FIXT.1.1)
- `SenderCompID`: Sender company ID
- `TargetCompID`: Target company ID
- `HeartBtInt`: Heartbeat interval in seconds
- `FileStorePath`: Path for message store files
- `FileLogPath`: Path for log files

**Acceptor Settings:**
- `ConnectionType=acceptor`
- `SocketAcceptHost`: Host to listen on (default: 0.0.0.0)
- `SocketAcceptPort`: Port to listen on

**Initiator Settings:**
- `ConnectionType=initiator`
- `SocketConnectHost`: Host to connect to
- `SocketConnectPort`: Port to connect to
- `ReconnectInterval`: Reconnection interval in seconds
- `ResetOnLogon`: Reset sequence numbers on logon (Y/N)

## API Reference

### Core Classes

#### SessionID
Represents a unique FIX session identifier.

```javascript
import { SessionID } from 'quickfix-js';

const sessionID = new SessionID('FIX.4.2', 'SENDER', 'TARGET');
console.log(sessionID.toString()); // FIX.4.2:SENDER->TARGET
```

#### Message
Represents a FIX message with header, body, and trailer.

```javascript
import { Message } from 'quickfix-js';

const message = new Message();
message.setBeginString('FIX.4.2');
message.setMsgType('D'); // New Order Single
message.setSenderCompID('SENDER');
message.setTargetCompID('TARGET');
message.setField(11, 'ORDER123'); // ClOrdID
message.setField(55, 'AAPL');     // Symbol
message.setField(54, '1');         // Side (Buy)
message.setField(38, '100');       // OrderQty
```

#### MessageBuilder
Build raw FIX messages from Message objects.

```javascript
import { MessageBuilder } from 'quickfix-js';

const builder = new MessageBuilder();
const rawMessage = builder.build(message);
console.log(rawMessage); // 8=FIX.4.2|9=...|...
```

#### MessageParser
Parse raw FIX messages into Message objects.

```javascript
import { MessageParser } from 'quickfix-js';

const parser = new MessageParser();
const message = parser.parse(rawMessage);
console.log(message.getMsgType()); // D
```

#### Session
Manages a single FIX session with state, sequence numbers, and protocol logic.

```javascript
const session = new Session(sessionID, store, log, application, heartbeatInterval);
await session.initialize();
await session.logon();
await session.send(message);
await session.logout();
```

### Storage

#### MemoryStore
In-memory message storage (for testing).

```javascript
import { MemoryStoreFactory } from 'quickfix-js';

const storeFactory = new MemoryStoreFactory();
```

#### FileStore
Persistent file-based message storage.

```javascript
import { FileStoreFactory } from 'quickfix-js';

const storeFactory = new FileStoreFactory('./store');
```

### Logging

#### ConsoleLog
Logs to console output.

```javascript
import { ConsoleLogFactory } from 'quickfix-js';

const logFactory = new ConsoleLogFactory();
```

#### FileLog
Logs to file system.

```javascript
import { FileLogFactory } from 'quickfix-js';

const logFactory = new FileLogFactory('./logs');
```

### Application Callbacks

Extend the `Application` class to handle session events and messages:

```javascript
import { Application } from 'quickfix-js';

class MyApplication extends Application {
  onCreate(sessionID) {
    // Called when session is created
  }

  onLogon(sessionID) {
    // Called when logon is successful
  }

  onLogout(sessionID) {
    // Called when logout occurs
  }

  toAdmin(message, sessionID) {
    // Called before sending admin message
  }

  fromAdmin(message, sessionID) {
    // Called when admin message is received
  }

  toApp(message, sessionID) {
    // Called before sending application message
  }

  fromApp(message, sessionID) {
    // Called when application message is received
  }
}
```

## Message Types

### Administrative Messages
- `0` - Heartbeat
- `1` - Test Request
- `2` - Resend Request
- `4` - Sequence Reset
- `5` - Logout
- `A` - Logon

### Application Messages
- `D` - New Order Single
- Plus many more defined in FIX data dictionaries

## Examples

### Running the Examples

1. **Start the Acceptor** (in one terminal):
```bash
node examples/acceptor.js
```

2. **Start the Initiator** (in another terminal):
```bash
node examples/initiator.js
```

Watch the FIX session establish with logon handshake and heartbeats!

### Sending a Custom Message

```javascript
import { Message } from 'quickfix-js';

// In your Application.onLogon callback:
onLogon(sessionID) {
  const session = initiator.getSession(sessionID);
  
  const order = new Message();
  order.setBeginString(sessionID.getBeginString());
  order.setMsgType('D'); // New Order Single
  order.setSenderCompID(sessionID.getSenderCompID());
  order.setTargetCompID(sessionID.getTargetCompID());
  order.setField(11, `ORDER${Date.now()}`); // ClOrdID
  order.setField(55, 'AAPL');                // Symbol
  order.setField(54, '1');                    // Side (Buy)
  order.setField(38, '100');                  // OrderQty
  order.setField(40, '2');                    // OrdType (Limit)
  order.setField(44, '150.00');               // Price
  
  session.send(order);
}
```

## Project Structure

```
quickfix-js/
├── core/               # Core FIX primitives and engine
│   ├── Field.js
│   ├── FieldMap.js
│   ├── Group.js
│   ├── Message.js
│   ├── SessionID.js
│   ├── SessionSettings.js
│   ├── Session.js
│   ├── DataDictionary.js
│   ├── MessageParser.js
│   ├── MessageBuilder.js
│   └── Application.js
├── transport/          # Network I/O
│   ├── SocketAcceptor.js
│   └── SocketInitiator.js
├── store/              # Message persistence
│   ├── MessageStore.js
│   ├── MemoryStore.js
│   ├── FileStore.js
│   └── StoreFactory.js
├── logging/            # Logging system
│   ├── Log.js
│   ├── ConsoleLog.js
│   ├── FileLog.js
│   └── LogFactory.js
├── fix/                # FIX data dictionaries
│   └── data/
│       ├── FIX42.json
│       ├── FIX44.json
│       └── ...
└── examples/           # Usage examples
    ├── acceptor.js
    ├── initiator.js
    └── simple-test.js
```

## Advanced Features

### Sequence Number Management
The library automatically manages sequence numbers for all messages. Sequence numbers are persisted in the message store.

### Gap Detection and Recovery
The library automatically detects sequence gaps and sends ResendRequest messages to recover missing messages.

### Heartbeat Monitoring
Automatic heartbeat messages are sent when no messages are exchanged. Test requests are sent when heartbeats are not received.

### Message Validation
When a DataDictionary is loaded, messages are validated against the FIX specification including required fields and data types.

## Supported FIX Versions

- FIX.4.0
- FIX.4.2
- FIX.4.4
- FIX.5.0
- FIX.5.0SP2
- FIXT.1.1

## Architecture

QuickFIX-JS follows a modular architecture similar to QuickFIX/J:

1. **Core Engine**: Manages sessions, sequence numbers, and protocol logic
2. **Transport Layer**: Handles network connectivity (TCP/TLS)
3. **Storage Layer**: Persists messages and sequence numbers
4. **Logging Layer**: Records all FIX messages and events
5. **Configuration**: QuickFIX-compatible settings files

## License

MIT

## Contributing

Contributions are welcome! Please submit pull requests or open issues.

## Resources

- [FIX Protocol Official Site](https://www.fixtrading.org/)
- [QuickFIX/J Documentation](https://www.quickfixj.org/)
- [FIX Protocol Specifications](https://www.fixtrading.org/standards/)
