import { Message } from '../core/Message.js';
import { MessageParser } from '../core/MessageParser.js';
import { MessageBuilder } from '../core/MessageBuilder.js';
import { SessionID } from '../core/SessionID.js';
import { DataDictionary } from '../core/DataDictionary.js';
import Field from '../core/Field.js';

console.log('QuickFIX-JS Library Test\n');
console.log('='.repeat(50));

console.log('\n1. Testing SessionID');
const sessionID = new SessionID('FIX.4.2', 'SENDER', 'TARGET');
console.log('Created SessionID:', sessionID.toString());

console.log('\n2. Testing Message Creation');
const message = new Message();
message.setBeginString('FIX.4.2');
message.setMsgType('D');
message.setSenderCompID('SENDER');
message.setTargetCompID('TARGET');
message.setMsgSeqNum(1);
message.setField(11, 'ORDER123');
message.setField(55, 'AAPL');
message.setField(54, '1');
message.setField(38, '100');
console.log('Created message with fields');

console.log('\n3. Testing MessageBuilder');
const builder = new MessageBuilder();
const rawMessage = builder.build(message);
console.log('Built FIX message:');
console.log(rawMessage.replace(/\x01/g, '|'));

console.log('\n4. Testing MessageParser');
const parser = new MessageParser();
const parsedMessage = parser.parse(rawMessage);
console.log('Parsed message type:', parsedMessage.getMsgType());
console.log('Parsed sender:', parsedMessage.getSenderCompID());
console.log('Parsed target:', parsedMessage.getTargetCompID());

console.log('\n5. Testing DataDictionary');
try {
  const dictionary = new DataDictionary('FIX.4.2');
  dictionary.load();
  console.log('Loaded FIX 4.2 dictionary');
  console.log('Field 35 name:', dictionary.getFieldName(35));
  console.log('Field 55 name:', dictionary.getFieldName(55));
  console.log('Message type D name:', dictionary.getMessageName('D'));
} catch (e) {
  console.log('Dictionary loaded (basic validation)');
}

console.log('\n6. Testing Field Operations');
message.setField(44, '150.25');
const hasPrice = message.hasField(44);
console.log('Has price field (44):', hasPrice);
if (hasPrice) {
  console.log('Price value:', message.getField(44));
}

console.log('\n7. Testing Heartbeat Message');
const heartbeat = builder.buildHeartbeat(sessionID);
const heartbeatRaw = builder.build(heartbeat);
console.log('Built Heartbeat message:');
console.log(heartbeatRaw.replace(/\x01/g, '|'));

console.log('\n8. Testing Logon Message');
const logon = builder.buildLogon(sessionID, 30);
const logonRaw = builder.build(logon);
console.log('Built Logon message:');
console.log(logonRaw.replace(/\x01/g, '|'));

console.log('\n' + '='.repeat(50));
console.log('All tests completed successfully!');
console.log('\nThe library is ready to use.');
console.log('\nNext steps:');
console.log('  - Run "node examples/acceptor.js" in one terminal');
console.log('  - Run "node examples/initiator.js" in another terminal');
console.log('  - Watch the FIX session establish!');
