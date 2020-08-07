import React from 'react';
import _ from 'lodash';

import CurieSelector from './CurieSelector';

const defaultProps = {
  initialInputs: {
    type: 'disease', term: '', curie: '',
  },
  search: () => Promise.resolve({ options: [] }),
  size: undefined,
  width: 0, // will be ignored
  disableType: false,
  disableTypeFilter: false,
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
      concepts, search, width, size, disableType, disableTypeFilter,
    } = this.props;
    const { type, term, curie } = this.state;
    return (
      <CurieSelector
        ref={(ref) => { this.curieSelector = ref; }}
        type={type}
        term={term}
        curie={curie}
        concepts={concepts}
        onClear={this.onClear}
        onReopen={this.onReopen}
        onTypeChange={this.onTypeChange}
        onTermChange={this.onTermChange}
        onSelect={this.onSelect}
        disableType={disableType}
        disableTypeFilter={disableTypeFilter}
        search={search}
        width={width}
        size={size}
      />
    );
  }
}

CurieSelectorContainter.defaultProps = defaultProps;

export default CurieSelectorContainter;
