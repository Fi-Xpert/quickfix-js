import Field from './Field.js';

export class FieldMap {
  constructor() {
    this.fields = new Map();
    this.groups = new Map();
  }

  setField(tag, value) {
    if (value instanceof Field) {
      this.fields.set(value.getTag(), value);
    } else {
      this.fields.set(parseInt(tag), new Field(tag, value));
    }
  }

  getField(tag) {
    const field = this.fields.get(parseInt(tag));
    if (!field) {
      throw new Error(`Field ${tag} not found`);
    }
    return field.getValue();
  }

  hasField(tag) {
    return this.fields.has(parseInt(tag));
  }

  removeField(tag) {
    this.fields.delete(parseInt(tag));
  }

  getFields() {
    return Array.from(this.fields.values());
  }

  setGroup(tag, group) {
    if (!this.groups.has(parseInt(tag))) {
      this.groups.set(parseInt(tag), []);
    }
    this.groups.get(parseInt(tag)).push(group);
  }

  getGroup(tag, index = 0) {
    const groups = this.groups.get(parseInt(tag));
    if (!groups || !groups[index]) {
      throw new Error(`Group ${tag} at index ${index} not found`);
    }
    return groups[index];
  }

  getGroups(tag) {
    return this.groups.get(parseInt(tag)) || [];
  }

  hasGroup(tag) {
    return this.groups.has(parseInt(tag)) && this.groups.get(parseInt(tag)).length > 0;
  }

  getGroupCount(tag) {
    return this.groups.has(parseInt(tag)) ? this.groups.get(parseInt(tag)).length : 0;
  }

  clear() {
    this.fields.clear();
    this.groups.clear();
  }
}

export default FieldMap;
