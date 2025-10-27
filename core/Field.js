export class Field {
  constructor(tag, value) {
    this.tag = parseInt(tag);
    this.value = value;
  }

  getTag() {
    return this.tag;
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
  }

  toString() {
    return `${this.tag}=${this.value}`;
  }

  static SOH = '\x01';
}

export default Field;
