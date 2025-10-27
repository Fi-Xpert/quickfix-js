export class Log {
  onIncoming(message) {
    throw new Error('Method not implemented');
  }

  onOutgoing(message) {
    throw new Error('Method not implemented');
  }

  onEvent(text) {
    throw new Error('Method not implemented');
  }

  clear() {
  }
}

export default Log;
