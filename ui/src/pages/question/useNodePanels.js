import { useState } from 'react';
import _ from 'lodash';

import entityNameDisplay from '../utils/entityNameDisplay';

const _publicFields = ['id', 'name', 'type', 'curie', 'set', 'curieEnabled'];
const _privateFields = ['panelType', 'deleted', 'regular'];
const _nodeFunctionTypes = ['curieEnabled', 'set', 'regular'];

export default function useNodePanels() {
  const [nodes, updateNodes] = useState([]);
  const [id, setId] = useState(null);
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [curie, setCurie] = useState([]);
  const [properties, setProperties] = useState([]);
  const [curieEnabled, setCurieEnabled] = useState(false);
  const [set, setSet] = useState(false);
  const [regular, setRegular] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Convert to JSON object representation. Only return "non-empty" field
  function toJsonObj() {
    const jsonObj = {
      id,
      type,
      set,
      curieEnabled,
      deleted,
    };
    properties.forEach((prop) => {
      jsonObj[prop.key] = prop.value;
    });
    if (name !== '') {
      jsonObj.name = name;
    }
    if (curie.length > 0) {
      jsonObj.curie = curie;
    }
    return jsonObj;
  }

  function constructor(store, userObj = {}) {
    this.store = store;
    runInAction(() => {
      this.id = this.getUniqueId();
      // Assign any supplied params to this instance
      Object.keys(userObj).forEach((key) => {
        if (this._publicFields.includes(key) || this._privateFields.includes(key)) {
          this[key] = userObj[key];
        } else {
          // we need to get the specific type of the numbers
          let type;
          if (typeof userObj[key] === 'number' && Number.isInteger(userObj[key])) {
            type = 'integer';
          } else if (typeof userObj[key] === 'number') {
            type = 'float';
          } else {
            type = typeof userObj[key];
          }
          this.properties.push({ key, value: userObj[key], type });
        }
      });
      // Ensure curie is always an array of strings
      if ((typeof this.curie === 'string') || (this.curie instanceof String)) {
        this.curie = [this.curie];
      }
      if (this.curie.length !== 0) {
        this.curieEnabled = true;
      }
      if (Object.keys(userObj).length && !this.set && !this.curieEnabled && this.type) {
        this.regular = true;
      }
      if (Object.keys(userObj).length && this.type) {
        this.searchTerm = this.name || (this.set && `Set Of ${this.type}s`) || this.type;
      }
    });
  }

  function createNew(nodeContents) {
    console.log(nodeContents);
    nodes.push(nodeContents);
    updateNodes([...nodes]);
  }

  function getById(nodeId) {
    return nodes.find((node) => node.id === nodeId);
  }

  // Return list of ids for nodes that are not flagged with deleted = true
  function visibleNodes() {
    return nodes.filter((node) => !node.deleted);
  }

  function resetNodePanel() {
    this.curie = [];
    this.name = '';
    this.type = '';
    this.properties = [];
    this.curieEnabled = false;
    this.set = false;
    this.regular = false;
  }

  function changeNodeFunction(field) {
    this._nodeFunctionTypes.forEach((node) => {
      this[node] = field === node;
    });
    if (!this.curieEnabled) this.name = '';
  }

  // Returns lowest non-zero integer id not already used
  function getUniqueId() {
    const candidateIds = _.range(this.store.panelState.length + 1);
    const currentIds = this.store.nodeIdList();
    return _.difference(candidateIds, currentIds).sort((a, b) => a - b)[0];
  }

  function updateField(field, value) { // eslint-disable-line consistent-return
    // Reset the curieList and propertiesList for Node if a new type is selected
    if (field === 'type') {
      if (type !== value) {
        resetCurie();
        resetProperties();
      }
      if (value === 'named_thing') {
        setRegular(true);
        setCurieEnabled(false);
      }
    }
    this[field] = value;
  }

  function updateSearchTerm(value) {
    setSearchTerm(value);
    if (curie.length) {
      resetCurie();
    }
    if (type) {
      setType('');
    }
  }

  function addProperty() {
    this.properties.push({ key: '', value: '', type: '' });
  }

  function updateProperty(value, i, keyValue) {
    if (keyValue === 'key') {
      const [val, type] = value.split(':');
      this.properties[i].key = val;
      this.properties[i].type = type.toLowerCase();
      if (type === 'INTEGER' || type === 'FLOAT') {
        this.properties[i].value = 0;
      } else if (type === 'BOOLEAN') {
        this.properties[i].value = true;
      } else {
        this.properties[i].value = '';
      }
    } else {
      this.properties[i].value = value;
    }
  }

  function deleteProperty(i) {
    this.properties.splice(i, 1);
  }

  function resetProperties() {
    setProperties([]);
  }

  function addCurie() {
    this.curie.push('');
  }

  function deleteCurie(i) {
    this.curie.splice(i, 1);
  }

  function updateCurie(type, label, curie) {
    // only update the panel once a curie is selected.
    if (curie) {
      this.curie[0] = curie;
      setName(label);
    }
  }

  function resetCurie() {
    setCurie([]);
    setName('');
  }

  function isValidType() {
    if (!this.type) {
      return true;
    }
    return this.store.concepts.indexOf(this.type) > -1;
  }

  function isValidCurie(val) {
    return /^[a-z0-9_.\+\-]+:[a-z0-9_\+\-]+/i.test(val); // eslint-disable-line no-useless-escape
  }

  function isValidCurieList() {
    if (!this.curieEnabled) {
      return true; // If curie not enabled, this should return true
    } else if (this.curie.length === 0) {
      return false; // if there are no curies and curies are enabled, disable the button. it should be red, not grey, meaning there's an error
    }
    let curieList = toJS(this.curie);
    if (_.isPlainObject(curieList)) {
      curieList = [curieList];
    }
    const isValid = curieList.reduce((isVal, curie) => isVal && this.isValidCurie(curie), true);
    return isValid;
  }

  function isValidProperties() {
    if (!this.properties.length) {
      return true; // if there are no properties, is valid
    }
    const valid = !this.properties.some(prop => !prop.key || prop.value === ''); // if any properties are blank, not valid
    return valid;
  }

  function isCompleted() {
    if (this.searchTerm && !this.type && !this.curie.length) {
      return false;
    }
    return true;
  }

  function isValid() {
    const valid = this.isValidType && this.isValidCurieList && !this.deleted && this.isValidProperties && this.isCompleted;
    return valid;
  }

  // Prettified label for the panel
  function panelName() {
    let newName = name || 'Any';
    if (type && !name) {
      newName = entityNameDisplay(type);
    }
    if (set) {
      newName = `Set Of ${name || newName}s`;
    }
    return `${id}: ${newName}`;
  }

  /**
   * Determines if contents of this instance matches another
   * @param {Object} other - Other Panel like object
   */
  function isEqual(other) {
    if (!(other instanceof NodePanel)) {
      return false;
    }
    return _.isEqual(this.toJsonObj(), other.toJsonObj());
  }

  // Make a deep clone of this instance
  function clone() {
    const userObj = toJsonObj();
    // this._publicFields.forEach(field => (userObj[field] = toJS(this[field])));
    return createNew(userObj);
  }

  return {
    createNew,
    toJsonObj,
    getUniqueId,
    nodes,
  };
}
