import React from 'react';

import { FormGroup, FormControl, InputGroup, DropdownButton, MenuItem, Button, Glyphicon } from 'react-bootstrap';

import BionamesBrowser from './BionamesBrowser';

import entityNameDisplay from '../util/entityNameDisplay';


class Bionames extends React.Component {
  constructor(props) {
    super(props);

    this.handleSearch = this.handleSearch.bind(this);
    this.wrapSearch = this.wrapSearch.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleReopen = this.handleReopen.bind(this);

    this.onInputFocus = this.onInputFocus.bind(this);
    this.onUnSelect = this.onUnSelect.bind(this);

    this.state = {
      term: '',
      type: 'disease',
      options: null,
      showOptions: false,
      loadingOptions: false,
      selected: null,
      hasSelected: false,
    };

    this.input = null; // Input reference for focusing
  }

  componentDidMount() {
    // this.input.focus();
  }
  onInputFocus() {
    this.setState({ showOptions: true }, () => { this.onUnSelect(); this.handleTermChange({ target: { value: this.state.term } }); });
  }
  onUnSelect() {
    this.setState({ selected: null, hasSelected: false }, () => this.props.onUnSelect());
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
  handleSelect(value) {
    this.input.value = value.label;
    this.setState({ showOptions: false, selected: value, hasSelected: true }, () => this.props.onSelect(value));
  }
  handleTermChange(event) {
    const term = event.target.value;
    this.setState({ term, loadingOptions: true }, () => this.handleSearch(term, this.state.type));
  }
  handleTypeChange(type) {
    this.input.focus();
    this.setState({ type }, () => this.handleTermChange({ target: { value: this.state.term } }));
  }
  handleClear() {
    this.input.value = '';
    this.handleTermChange({ target: { value: '' } });
  }
  handleReopen() {
    this.setState({ showOptions: true }, () => { this.onUnSelect(); this.input.focus(); this.handleTermChange({ target: { value: this.state.term } }); });
  }

  render() {
    const typeOptions = this.props.concepts.map((c) => {
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

    const { showOptions, hasSelected, selected } = this.state;

    const curie = hasSelected ? selected.value : '';
    const rightButtonCallback = (showOptions || !hasSelected) ? this.handleClear : this.handleReopen;
    const rightButtonContents = (showOptions || !hasSelected) ? (<Glyphicon glyph="remove" />) : (<Glyphicon glyph="triangle-bottom" />);

    const width = this.props.width ? this.props.width : '100%';
    const browserWidth = this.props.width ? this.props.width - 10 : 0;
    return (
      <div
        id="bionames"
        style={{
          position: 'relative',
          display: 'inline-block',
          width,
        }}
      >
        <div>
          <FormGroup style={{ marginBottom: 0 }}>
            <InputGroup>
              <DropdownButton
                componentClass={InputGroup.Button}
                id="input-dropdown-addon"
                title={entityNameDisplay(this.state.type)}
                bsSize={this.props.size}
              >
                {typeOptions}
              </DropdownButton>
              <FormControl
                type="text"
                bsSize={this.props.size}
                style={{
                  borderLeft: 0,
                  borderRight: 0,
                }}
                inputRef={(ref) => {
                  this.input = ref;
                  try {
                    this.input.onfocus = this.onInputFocus;
                    this.input.onblur = this.onInputBlur;
                  } catch (err) {
                    // pass
                    // On initial creation this might get called before everything is ready.
                    // It will get called again.
                  }
                }}
                onChange={this.handleTermChange}
              />
              {hasSelected &&
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
              overflowY: 'scroll',
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
              type={this.state.type}
              onSelect={this.handleSelect}
              width={browserWidth}
            />
          </div>
        }
      </div>
    );
  }
}

Bionames.defaultProp = {
  search: () => Promise.resolve({ options: [] }),
  concepts: [],
  onSelect: () => {},
  onUnSelect: () => {},
  size: 'large',
  width: 0, // will be ignored
};

export default Bionames;
