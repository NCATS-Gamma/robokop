import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormControl, Button, Glyphicon } from 'react-bootstrap';
import FaPlus from 'react-icons/lib/fa/plus';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

// import AppConfig from './../../AppConfig';
import Loading from './../Loading';
import LabeledFormGroup from './../shared/LabeledFormGroup';
import CurieSelectorContainer from './../shared/CurieSelectorContainer';


const propTypes = {
  activePanel: PropTypes.shape({
    inputType: PropTypes.string.isRequired,
    inputLabel: PropTypes.string.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      curie: PropTypes.string.isRequired,
    })),
  }).isRequired,
};

@inject(({ store }) => ({ store }))
@observer
class FlowbokopInputBuilder extends React.Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
    this.validateFormElement = this.validateFormElement.bind(this);
    this.onChangeInputLabel = this.onChangeInputLabel.bind(this);
  }

  onChangeInputLabel(event) {
    return this.props.activePanel.updateInputLabel(event.target.value);
  }

  /**
   * Return if the specific form element is valid. If val is supplied, then uses
   * its value for validation. If not supplied, looks up corresponding prop and
   * returns associated validation flag
   */
  validateFormElement(field) {
    let isValid = false;
    switch (field.toLowerCase()) {
      case 'input':
        isValid = this.props.activePanel.isValidLabel;
        break;
      default:
        break;
    }
    return isValid ? 'success' : 'error';
  }

  onSearch(input, nodeType) {
    return this.props.store.appConfig.questionNewSearch(input, nodeType);
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    const curieSelectorElements = this.props.activePanel.data.map((singleCurie, i) => {
      singleCurie.term = singleCurie.label; // TODO: Maybe refactor CurieSelectorContainer to not use `term`
      const curieSelectorElement = (
        <div
          style={{ display: 'table-row' }}
          // key={this.state.keys[i]}
        >
          <div
            style={{ display: 'table-cell', padding: '5px 0px' }}
          >
            <CurieSelectorContainer
              concepts={toJS(this.props.store.concepts)}
              search={this.onSearch}
              disableType={i !== 0} // Only enable for 1st CurieSelector element
              initialInputs={toJS(singleCurie)}
              onChangeHook={(ty, te, cu) => this.props.activePanel.updateCurie(i, ty, te, cu)}
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
                onClick={() => this.props.activePanel.deleteCurie(i)}
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

    const classNames = {
      formLabel: 'col-md-2 form-label',
      formControl: 'col-md-10',
    };

    return (
      <div
        id="searchBionames"
      >
        <Form horizontal>
          <LabeledFormGroup
            formLabel="Input"
            value={this.props.activePanel.inputLabel}
            validateForm={() => this.validateFormElement('input')}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={this.props.activePanel.inputLabel}
              // placeholder={''}
              onChange={this.onChangeInputLabel}
            />
          </LabeledFormGroup>
        </Form>
        <div style={{ display: 'table', width: '100%' }}>
          {curieSelectorElements}
          <div style={{ display: 'table-row', textAlign: 'center' }}>
            <Button style={{ marginTop: '10px' }} onClick={this.props.activePanel.addCurie}>
              <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Curie'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const ready = this.props.store.dataReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

FlowbokopInputBuilder.propTypes = propTypes;
// FlowbokopInputBuilder.defaultProps = defaultProps;

export default FlowbokopInputBuilder;
