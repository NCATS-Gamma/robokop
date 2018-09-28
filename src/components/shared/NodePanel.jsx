import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormControl, Checkbox ,Button, Glyphicon } from 'react-bootstrap';
import FaPlus from 'react-icons/lib/fa/plus';
import { toJS } from 'mobx';
import { inject, observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { Multiselect, DropdownList } from 'react-widgets';

// import AppConfig from './../../AppConfig';
import Loading from './../Loading';
import LabeledFormGroup from './../shared/LabeledFormGroup';
import CurieSelectorContainer from './../shared/CurieSelectorContainer';

const classNames = {
  formLabel: 'col-md-2 form-label',
  formControl: 'col-md-10',
};

const propTypes = {
  activePanel: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    set: PropTypes.bool.isRequired,
    curie: mobxPropTypes.observableArrayOf(PropTypes.string),
    name: PropTypes.string,
  }).isRequired,
};

// @inject(({ store }) => ({ store }))
@observer
class NodePanel extends React.Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
    this.validateFormElement = this.validateFormElement.bind(this);
    // this.onChangeInputLabel = this.onChangeInputLabel.bind(this);
  }

  /**
   * Return if the specific form element is valid.
   */
  validateFormElement(field) {
    let isValid = false;
    const { activePanel } = this.props;
    switch (field.toLowerCase()) {
      case 'type':
        isValid = activePanel.isValidInput;
        break;
      case 'curie':
        isValid = this.props.activePanel.isValidCurieList;
        break;
      default:
        break;
    }
    return isValid ? 'success' : 'error';
  }

  onSearch(input, nodeType) {
    return this.props.activePanel.store.appConfig.questionNewSearch(input, nodeType);
  }

  getCurieSelectorElements() {
    const { activePanel } = this.props;
    // Note:
    const isTypeSelected = activePanel.type !== '';
    if (!isTypeSelected) { // Don't display a Curie selection dialog if type has not been selected yet
      return null;
    }
    let curieList;
    if (toJS(activePanel.curie).length !== 0) {
      curieList = toJS(activePanel.curie).map(curie => ({ curie, type: activePanel.type, label: '' }));
    } else {
      curieList = [{ type: activePanel.type, curie: '', label: '' }];
    }
    const curieSelectorElements = curieList.map((aCurie, i) => {
      const singleCurie = toJS(aCurie);
      singleCurie.term = singleCurie.label; // TODO: Maybe refactor CurieSelectorContainer to not use `term`
      delete singleCurie.label;
      const curieSelectorElement = (
        <div
          style={{ display: 'table-row' }}
          // key={this.state.keys[i]}
        >
          <div
            style={{ display: 'table-cell', padding: '5px 0px' }}
          >
            <CurieSelectorContainer
              concepts={toJS(activePanel.store.concepts)}
              search={this.onSearch}
              disableType
              initialInputs={singleCurie}
              onChangeHook={(ty, te, cu) => activePanel.updateCurie(i, ty, te, cu)}
            />
          </div>
          <div
            style={{
              display: 'table-cell', width: '30px', verticalAlign: 'middle', paddingLeft: '10px',
            }}
          >
            {(i !== 0) &&
              <Button
                bsStyle="default"
                onClick={() => activePanel.deleteCurie(i)}
                style={{ padding: '8px' }}
              >
                <Glyphicon glyph="trash" />
              </Button>
            }
          </div>
        </div>
      );
      return curieSelectorElement;
    });
    return curieSelectorElements;
  }

  renderLoaded() {
    const { activePanel } = this.props;
    return (
      <div>
        <Form horizontal>
          <LabeledFormGroup
            formLabel={
              <span>{'Node id  '}
                {/* <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={inputTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger> */}
              </span>
            }
            value={activePanel.id}
            validateForm={() => 'success'}
            classNames={{ ...classNames, ...{ formControl: 'col-md-2' } }}
          >
            <FormControl
              type="text"
              value={activePanel.id}
              disabled
            />
            {/* <Multiselect
              data={toJS(this.props.inputLabelList)}
              value={input}
              filter="contains"
              onChange={this.onChangeFactory('input')}
              containerClassName={input.length > 0 ? 'valid' : 'invalid'}
            /> */}
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel={
              <span>{'Node Type  '}
              </span>
            }
            value={activePanel.type}
            validateForm={() => this.validateFormElement('type')}
            classNames={classNames}
          >
            <DropdownList
              filter
              // dropUp
              // disabled={disableType}
              // style={{ display: 'table-cell', verticalAlign: 'middle', width: '200px' }}
              data={toJS(activePanel.store.concepts)}
              // textField="text"
              // valueField="value"
              value={activePanel.type}
              onChange={value => activePanel.updateField('type', value)}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel={
              <span>{'Is Node a set?  '}
                {/* <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={outputTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger> */}
              </span>
            }
            value=""
            validateForm={() => 'success'}
            classNames={{ ...classNames, ...{ formControl: 'col-md-2' } }}
          >
            <Checkbox
              checked={activePanel.set}
              onClick={e => activePanel.updateField('set', e.target.checked)}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel={
              <span>{'Name  '}
                {/* <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={inputTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger> */}
              </span>
            }
            value={activePanel.name}
            validateForm={() => 'success'}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={activePanel.name}
              onChange={e => activePanel.updateField('name', e.target.value)}
            />
          </LabeledFormGroup>
        </Form>
        <div style={{ display: 'table', width: '100%' }}>
          {this.getCurieSelectorElements()}
          <div style={{ display: 'table-row', textAlign: 'center' }}>
            <Button style={{ marginTop: '10px' }} onClick={activePanel.addCurie}>
              <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Curie'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { store } = this.props.activePanel;
    const ready = store.dataReady && store.conceptsReady && store.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

NodePanel.propTypes = propTypes;
// FlowbokopOperationBuilder.defaultProps = defaultProps;

export default NodePanel;
