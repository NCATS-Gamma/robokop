import React from 'react';
import PropTypes from 'prop-types';

import CurieSelector from './CurieSelector';

const _ = require('lodash');

const propTypes = {
  concepts: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialInputs: PropTypes.shape({
    type: PropTypes.string.isRequired,
    term: PropTypes.string.isRequired,
    curie: PropTypes.string.isRequired,
  }),
  onChangeHook: PropTypes.func, // Hook to be notified any time there is any user activated changes: (type, term, curie) => {}
  displayType: PropTypes.bool,
  width: PropTypes.number,
  search: PropTypes.func,
  size: PropTypes.string,
};

const defaultProps = {
  initialInputs: {
    type: 'disease', term: '', curie: '',
  },
  search: () => Promise.resolve({ options: [] }),
  size: undefined,
  width: 0, // will be ignored
  displayType: true,
  onChangeHook: () => {},
};

class CurieSelectorContainter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      type: props.initialInputs.type,
      term: props.initialInputs.term,
      curie: props.initialInputs.curie,
    };

    this.onClear = this.onClear.bind(this);
    this.onReopen = this.onReopen.bind(this);
    this.onTypeChange = this.onTypeChange.bind(this);
    this.onTermChange = this.onTermChange.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  componentDidMount() {
    // this.input.focus();
  }

  componentWillReceiveProps(nextProps) {
    // console.log('in componentWillReceiveProps', nextProps.initialInputs, this.props.initialInputs);
    if (!_.isEqual(nextProps.initialInputs, this.props.initialInputs)) {
      const { type, term, curie } = nextProps.initialInputs;
      this.setState(
        { type, term, curie },
        () => { this.props.onChangeHook(type, term, curie); },
      );
    }
  }

  onClear() {
    this.invalidateInputs(
      ['term', 'curie'],
      () => this.props.onChangeHook(this.state.type, this.state.term, this.state.curie),
    );
  }

  onReopen() {
    this.invalidateInputs(
      ['curie'],
      () => this.props.onChangeHook(this.state.type, this.state.term, this.state.curie),
    );
  }

  onTypeChange(type) {
    this.setState({ type }, () => this.onClear());
  }

  onTermChange(event) {
    const term = event.target.value;
    this.setState({ term, curie: '' }, () => this.props.onChangeHook(this.state.type, this.state.term, this.state.curie));
  }

  onSelect(type, term, curie) {
    this.setState({ type, term, curie }, () => this.props.onChangeHook(type, term, curie));
  }

  invalidateInputs(fields, callback = () => {}) {
    // Invalidates all provided fields in state with empty strings
    // eg: invalidateInputs(['term', 'curie'])
    const newState = {};
    fields.forEach((field) => {
      newState[field] = '';
    });
    this.setState(newState, callback);
  }

  render() {
    const {
      concepts, search, width, size, displayType,
    } = this.props;
    const { type, term, curie } = this.state;
    return (
      <CurieSelector
        type={type}
        term={term}
        curie={curie}
        concepts={concepts}
        onClear={this.onClear}
        onReopen={this.onReopen}
        onTypeChange={this.onTypeChange}
        onTermChange={this.onTermChange}
        onSelect={this.onSelect}
        displayType={displayType}
        search={search}
        width={width}
        size={size}
      />
    );
  }
}

CurieSelectorContainter.propTypes = propTypes;
CurieSelectorContainter.defaultProps = defaultProps;

export default CurieSelectorContainter;
