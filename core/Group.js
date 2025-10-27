import FieldMap from './FieldMap.js';

export class Group extends FieldMap {
  constructor(delimiterTag, delimiterValue) {
    super();
    this.delimiterTag = delimiterTag;
    if (delimiterValue !== undefined) {
      this.setField(delimiterTag, delimiterValue);
    }
  }

  getDelimiterTag() {
    return this.delimiterTag;
  }
}

export default Group;
