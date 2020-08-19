import { useState, useRef } from 'react';

const _publicFields = ['id', 'source_id', 'target_id', 'predicate'];

export default function useEdgePanels() {
  const [id, setId] = useState(null);
  const [sourceId, setSourceId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [predicate, setPredicate] = useState([]);
  const [targetNodeList, setTargetNodeList] = useState([]);
  const [connectionsCountReady, setConnectionsCountReady] = useState(false);

  const [broken, setBroken] = useState(false);

  const [predicatesReady, setPredicatesReady] = useState(false); // True when requesting end-point for predicates for source/target pairing
  const [predicateList, updatePredicateList] = useState([]);
  const [disablePredicates, setDisablePredicates] = useState(false);

  const connectionsCancel = useRef(null);
  const predicatesCancel = useRef(null);

  function createNew(newEdge) {
    console.log(newEdge);
  }

  function constructor(store, userObj = {}) {
    this.store = store;
    this.appConfig = new AppConfig(config);
    runInAction(() => {
      this.id = this.getUniqueId();
      // Assign any supplied params to this instance
      this._publicFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(userObj, field)) {
          this[field] = userObj[field];
        }
      });
    });
    this.getSourceAndTarget();
    this.getConnectionsCount();
    this.getPredicates();
  }

  // Returns lowest non-zero integer id not already used
  function getUniqueId() {
    const candidateIds = _.range(this.store.panelState.length + 1);
    const currentIds = this.store.edgeIdList();
    return _.difference(candidateIds, currentIds).sort()[0];
  }

  function getSourceAndTarget() {
    for (let i = this.store.nodePanels.length - 1; i >= 0; i -= 1) {
      if (this.target_id === null) {
        this.target_id = this.store.nodePanels[i].id;
      } else if (this.source_id === null) {
        this.source_id = this.store.nodePanels[i].id;
        break;
      }
    }
  }

  function cancelConnectionsCall() {
    if (this.connectionsCancel) {
      this.appConfig.getRankedPredicates(
        [],
        this.connectionsCancel,
        true,
      );
      this.connectionsCancel = null;
    }
  }

  function getConnectionsCount() {
    if (this.connectionsCancel) { // if there's already a request out there
      this.cancelConnectionsCall();
      this.getConnectionsCount();
    } else {
      const { CancelToken } = axios;
      this.connectionsCancel = CancelToken.source();
      const allTargetNodes = this.store.visibleNodePanels.filter(panel => this.source_id !== panel.id);
      const targetNodes = allTargetNodes.map((targNode) => {
        const target = {};
        target.id = targNode.id;
        target.name = targNode.panelName;
        return target;
      });
      this.setTargetList(targetNodes, false);
      const sourceNode = this.store.getNodePanelById(this.source_id);
      const node1 = { type: sourceNode.type };
      if (sourceNode.curie.length) {
        [node1.id] = sourceNode.curie;
      }
      const connectionsPromises = allTargetNodes.map((node) => {
        const node2 = { type: node.type };
        if (node.curie.length) {
          [node2.id] = node.curie;
        }
        return new Promise((resolve, reject) => (
          this.appConfig.getRankedPredicates(
            [node1, node2],
            this.connectionsCancel,
            false,
          )
            .then((res) => {
              resolve({ predicates: res.data, target: node });
            })
            .catch((err) => {
              console.log('connection count error', err);
              reject(err);
            })));
      });
      Promise.all(connectionsPromises)
        .then((res) => {
          const targetList = res.map((e) => {
            const target = {};
            let predicateCount = 0;
            Object.keys(e.predicates).forEach((predicate) => {
              predicateCount += e.predicates[predicate];
            });
            target.id = e.target.id;
            target.name = e.target.panelName;
            target.degree = predicateCount;
            return target;
          });
          this.setTargetList(targetList, true);
          this.connectionsCancel = null;
        })
        .catch((err) => {
          console.log('error', err);
          this.setTargetList([], true);
          this.connectionsCancel = null;
        });
    }
  }

  function setTargetList(targetList, ready) {
    this.targetNodeList = [...targetList];
    this.connectionsCountReady = ready;
  }

  function cancelPredicatesCall() {
    if (this.predicatesCancel) {
      this.appConfig.getRankedPredicates(
        [],
        this.predicatesCancel,
        true,
      );
      this.predicatesCancel = null;
    }
  }

  function getPredicates() {
    if (this.source_id !== null && this.target_id !== null) {
      if (this.predicatesCancel) {
        this.cancelPredicatesCall();
        this.getPredicates();
      } else {
        this.setPredicateList([], false, false);
        const { CancelToken } = axios;
        this.predicatesCancel = CancelToken.source();
        const sourceNode = this.store.getNodePanelById(this.source_id);
        const targetNode = this.store.getNodePanelById(this.target_id);
        const node1 = { type: sourceNode.type };
        if (sourceNode.curie.length) {
          [node1.id] = sourceNode.curie;
        }
        const node2 = { type: targetNode.type };
        if (targetNode.curie.length) {
          [node2.id] = targetNode.curie;
        }
        this.appConfig.getRankedPredicates(
          [node1, node2],
          this.predicatesCancel,
          false,
        )
          .then((res) => {
            const data = { ...res.data };
            const predicates = Object.keys(data).map(predicate => (
              { name: predicate, degree: data[predicate] }
            ));
            this.setPredicateList(predicates, true, false);
            this.predicatesCancel = null;
          })
          .catch((err) => {
            console.log('Predicate error', err);
            this.setPredicateList([], true, false);
            this.predicatesCancel = null;
          });
      }
    } else {
      this.setPredicateList([], true, true);
    }
  }

  function setPredicateList(predicates, ready, disabled) {
    this.predicateList = [...predicates];
    this.predicatesReady = ready;
    this.disablePredicates = disabled;
  }

  function updateField(field, value) { // eslint-disable-line consistent-return
    if (this._publicFields.indexOf(field) > -1) {
      this[field] = value;
      if (field === 'source_id') {
        this.targetNodeList = [];
        this.getConnectionsCount(); // this needs to happen before we reset the target_id
      }
      if (this.source_id === this.target_id) {
        this.target_id = null;
      }
      if (field === 'source_id' || field === 'target_id') {
        this.getPredicates();
      }
    } else {
      console.error(`Invalid field - ${field} supplied to EdgePanel.updateField action`);
    }
  }

  function switchSourceTarget() {
    const source = this.source_id;
    this.source_id = this.target_id;
    this.target_id = source;
    this.getConnectionsCount();
    this.getPredicates();
  }

  function updatePredicate(predicates) {
    const predicateList = predicates.map(p => p.name || p);
    this.predicate = predicateList;
  }

  function sourceNode() {
    const sourceNode = this.store.nodePanels.find(panel => panel.id === this.source_id);
    if (sourceNode) {
      return sourceNode;
    }
    return null;
  }

  function targetNode() {
    const targetNode = this.store.nodePanels.find(panel => panel.id === this.target_id);
    if (targetNode) {
      return targetNode;
    }
    return null;
  }

  function isValidSource() {
    return this.store.isValidNode(this.source_id) && !this.sourceNode.deleted;
  }

  function isValidTarget() {
    return this.store.isValidNode(this.target_id) && !this.targetNode.deleted;
  }

  function isValidPredicate() {
    return this.store.predicatesReady &&
      !this.disablePredicates;
  }

  function isValid() {
    return this.isValidSource && this.isValidTarget && !this.broken;
  }

  // Prettified label for the panel
  function panelName() {
    let sourceLabel = '';
    let targetLabel = '';
    if (this.source_id !== null) {
      sourceLabel = this.store.getPanelsByType(panelTypes.node)
        .filter(panel => panel.id === this.source_id)[0].panelName;
    }
    if (this.target_id !== null) {
      targetLabel = this.store.getPanelsByType(panelTypes.node)
        .filter(panel => panel.id === this.target_id)[0].panelName;
    }
    let predicateLabel = this.predicate.join(', ');
    predicateLabel = predicateLabel ? `—[${predicateLabel}]` : '';
    return `${sourceLabel} ${predicateLabel}→ ${targetLabel}`;
  }

  /**
   * Determines if contents of this instance matches another
   * @param {Object} other - Other Panel like object
   */
  function isEqual(other) {
    if (!(other instanceof EdgePanel)) {
      return false;
    }
    return _.isEqual(this.toJsonObj(), other.toJsonObj());
  }

  // Make a deep clone of this instance
  function clone() {
    const userObj = this.toJsonObj();
    // this._publicFields.forEach(field => (userObj[field] = toJS(this[field]))); // eslint-disable-line no-underscore-dangle
    return new EdgePanel(this.store, userObj);
  }

  function toJsonObj() {
    const jsonObj = {
      id: toJS(this.id),
      source_id: toJS(this.source_id),
      target_id: toJS(this.target_id),
    };
    if (this.predicate.length > 0) {
      jsonObj.predicate = toJS(this.predicate);
    }
    return jsonObj;
  }
  return {
    createNew,
  };
}
