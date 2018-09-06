import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, FormControl, InputGroup, DropdownButton, MenuItem, Glyphicon } from 'react-bootstrap';

import BionamesBrowser from './BionamesBrowser';

import entityNameDisplay from '../util/entityNameDisplay';


const propTypes = {
  term: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  curie: PropTypes.string.isRequired,
  concepts: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClear: PropTypes.func.isRequired, // When X icon is clicked to clear input
  onReopen: PropTypes.func.isRequired, // When triangle drop-down icon is clicked
  onTypeChange: PropTypes.func.isRequired, // When type changed by drop-down selection
  onTermChange: PropTypes.func.isRequired, // When term input field is typed in
  onSelect: PropTypes.func.isRequired, // When entity is selected: (type, term, curie) => {}
  displayType: PropTypes.bool, // Whether to display the Type drop-down
  width: PropTypes.number,
  search: PropTypes.func,
  size: PropTypes.string, // undefined (default size) or 'small', 'xsmall', 'large'
};

const defaultProps = {
  search: () => Promise.resolve({ options: [] }),
  width: 0, // will be ignored
  displayType: true,
};

class CurieSelector extends React.Component {
  /*
  Note: All handlers (in props) must ensure that the supplied props.curie is
  always invalidated into an empty string any time the user takes an action
  that moves it away from a "selected" state.
  */
  constructor(props) {
    super(props);

    this.handleSearch = this.handleSearch.bind(this);
    this.wrapSearch = this.wrapSearch.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
    // this.handleClear = this.handleClear.bind(this);
    this.handleReopen = this.handleReopen.bind(this);

    // this.onInputFocus = this.onInputFocus.bind(this);
    // this.onUnSelect = this.onUnSelect.bind(this);

    this.state = {
      options: null,
      loadingOptions: false,
    };

    this.input = null; // Input reference for focusing
  }

  componentDidMount() {
    // this.input.focus();
  }
  componentDidUpdate(prevProps) {
    if ((this.props.term !== prevProps.term) && (this.props.curie === '')) { // Re-do search if term changes
      this.setState({ loadingOptions: true }, () => this.handleSearch(this.props.term, this.props.type));
      // this.handleTermChange({ target: { value: this.props.term } });
    }
  }

  // onInputFocus() {
  //   this.setState({ showOptions: true }, () => { this.onUnSelect(); this.handleTermChange({ target: { value: this.state.term } }); });
  // }
  // onUnSelect() {
  //   this.setState({ selected: null, hasSelected: false }, () => this.props.onUnSelect());
  // }
  handleSelect(value) {
    const term = value.label;
    const curie = value.value;
    this.props.onSelect(this.props.type, term, curie);
  }
  handleSearch(input, nodeType) {
    this.wrapSearch(input, nodeType).catch(() => ({ options: [] })).then(data => this.setState({ options: data.options, loadingOptions: false }));
  }
  wrapSearch(input, nodeType) {
    if (!input || (input.length < 3)) {
      return Promise.resolve({ options: null });
    }
    return this.props.search(input, nodeType);
  }
  handleTermChange(event) {
    this.props.onTermChange(event);
    const term = event.target.value;
    this.setState({ loadingOptions: true }, () => this.handleSearch(term, this.props.type));
  }
  handleTypeChange(type) {
    this.input.focus();
    this.props.onTypeChange(type);
    // this.setState({ type }, () => this.handleTermChange({ target: { value: this.state.term } }));
  }
  // handleClear() {
  //   this.input.value = '';
  //   this.handleTermChange({ target: { value: '' } });
  // }
  handleReopen() {
    this.props.onReopen();
    this.input.focus();
  }

  render() {
    const {
      concepts, size, curie, type, term, onClear, displayType,
    } = this.props;
    const typeOptions = concepts.map((c) => {
      const displayConcept = entityNameDisplay(c);
      return (
        <MenuItem
          key={c}
          onClick={() => this.handleTypeChange(c)}
        >
          {displayConcept}
        </MenuItem>
      );
    });

    // const {
    //   showOptions, hasSelected, selected, displayType,
    // } = this.state;

    // const curie = hasSelected ? selected.curie : '';
    const showOptions = curie === '';

    // const showClearResultsIcon = (showOptions || !hasSelected);
    const rightButtonCallback = showOptions ? onClear : this.handleReopen;
    const rightButtonContents = showOptions ? (<Glyphicon glyph="remove" />) : (<Glyphicon glyph="triangle-bottom" />);

    const width = this.props.width ? this.props.width : '100%';
    const browserWidth = this.props.width ? this.props.width - 10 : 0;
    return (
      <div
        id="bionames"
        className="curie-selector"
        style={{
          position: 'relative',
          display: 'inline-block',
          width,
        }}
      >
        <div>
          <FormGroup style={{ marginBottom: 0 }}>
            <InputGroup>
              {displayType &&
                <DropdownButton
                  componentClass={InputGroup.Button}
                  id="input-dropdown-addon"
                  title={entityNameDisplay(type)}
                  bsSize={size}
                >
                  {typeOptions}
                </DropdownButton>
              }
              <FormControl
                type="text"
                bsSize={size}
                style={displayType ? {
                  borderLeft: 0,
                  borderRight: 0,
                } : {}}
                value={term}
                inputRef={(ref) => {
                  this.input = ref;
                  // try {
                  //   this.input.onfocus = this.onInputFocus;
                  //   this.input.onblur = this.onInputBlur;
                  // } catch (err) {
                  //   // pass
                  //   // On initial creation this might get called before everything is ready.
                  //   // It will get called again.
                  // }
                }}
                onChange={this.handleTermChange}
              />
              {!showOptions &&
                <InputGroup.Addon
                  style={{ background: '#fff' }}
                >
                  {curie}
                </InputGroup.Addon>
              }
              <InputGroup.Addon
                onClick={rightButtonCallback}
                style={{ background: '#fff', cursor: 'pointer' }}
              >
                {rightButtonContents}
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </div>
        {showOptions &&
          <div
            style={{
              position: 'absolute',
              border: '1px solid #d4d4d4',
              borderTop: 'none',
              zIndex: 99,
              top: '100%',
              left: 0,
              right: 0,
              overflowY: 'none',
              backgroundColor: '#fff',
              borderBottom: '1px solid #d4d4d4',
              marginLeft: '5px',
              marginRight: '5px',
              borderBottomLeftRadius: '4px',
              borderBottomRightRadius: '4px',
            }}
          >
            <BionamesBrowser
              thinking={this.state.loadingOptions}
              data={this.state.options}
              type={this.props.type}
              onSelect={this.handleSelect}
              width={browserWidth}
            />
          </div>
        }
      </div>
    );
  }
}

CurieSelector.propTypes = propTypes;
CurieSelector.defaultProps = defaultProps;

export default CurieSelector;
