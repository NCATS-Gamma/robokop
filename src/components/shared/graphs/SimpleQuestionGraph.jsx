import React from 'react';
import { toJS } from 'mobx';
import { Row, Col, Panel } from 'react-bootstrap';
import FaEye from 'react-icons/lib/fa/eye';
import FaEyeSlash from 'react-icons/lib/fa/eye-slash';
import MachineQuestionView from './MachineQuestionView';
import entityNameDisplay from '../../util/entityNameDisplay';

/* eslint-disable no-param-reassign */
const nodePreProcFn = (n) => {
  n.isSet = ('set' in n) && (((typeof n.set === typeof true) && n.set) || ((typeof n.set === 'string') && n.set === 'true'));
  n.chosen = false; // Not needed since borderWidth manually set below
  n.borderWidth = 1;
  n.borderWidthSelected = 2;
  if (n.isSet) {
    n.borderWidth = 3;
    n.borderWidthSelected = 5;
  } else {
    n.borderWidth = 1;
  }
  if (n.isSelected) { // Override borderwidth when isSelected set by user thru props
    n.borderWidth = n.borderWidthSelected;
  }
  if (!('label' in n)) {
    if ('name' in n) {
      n.label = n.name;
    } else if (n.curie) {
      if (Array.isArray(n.curie)) {
        if (n.curie.length > 0) {
          n.label = n.curie[0]; // eslint-disable-line prefer-destructuring
        } else {
          n.label = '';
        }
      } else {
        n.label = n.curie;
      }
    } else if ('type' in n) {
      n.label = entityNameDisplay(n.type);
    } else {
      n.label = '';
    }
  }
  n.label = `${n.id}: ${n.label}`;
  return n;
};
/* eslint-enable no-param-reassign */

class SimpleQuestionGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      graphVisible: true,
    };

    this.toggleGraphVisibility = this.toggleGraphVisibility.bind(this);
  }

  toggleGraphVisibility() {
    this.setState(state => ({ graphVisible: !state.graphVisible }));
  }

  render() {
    const { graphVisible } = this.state;
    const { store, concepts } = this.props;
    return (
      <Row>
        <div className="col-md-12" style={{ height: '20px' }} />
        <Col md={12}>
          <Panel expanded={graphVisible} onToggle={() => {}} >
            <Panel.Heading>
              <Panel.Title>
                {'Question Graph '}
                <div style={{ position: 'relative', float: 'right', top: '-3px' }}>
                  <button
                    style={{ padding: '2px', marginLeft: '5px' }}
                    className="btn btn-default"
                    title="Toggle visibility of Question graph"
                    onClick={this.toggleGraphVisibility}
                  >
                    <span style={{ fontSize: '22px' }}>
                      {graphVisible ? <FaEyeSlash style={{ cursor: 'pointer' }} /> : <FaEye style={{ cursor: 'pointer' }} />}
                    </span>
                  </button>
                </div>
              </Panel.Title>
            </Panel.Heading>
            <Panel.Collapse>
              <Panel.Body style={{ padding: '0px' }}>
                <MachineQuestionView
                  height={200}
                  // width={width}
                  question={toJS(store.message.question_graph)}
                  concepts={concepts}
                  graphState="display"
                  selectable
                  nodePreProcFn={nodePreProcFn}
                  graphClickCallback={() => {}} // we don't want the graph to select anything on click
                />
              </Panel.Body>
            </Panel.Collapse>
          </Panel>
        </Col>
      </Row>
    );
  }
}

export default SimpleQuestionGraph;
