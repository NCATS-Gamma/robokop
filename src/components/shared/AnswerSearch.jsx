import React from 'react';

const shortid = require('shortid');

const inputStyle = {
  width: '100%',
};
const buttonStyle = {
  display: 'block',
};

class AnswerSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDropdown: false,
      searchValue: '',
      filterValue: '',
    };

    this.onChange = this.onChange.bind(this);
    this.setValue = this.setValue.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.sendValueBack = this.sendValueBack.bind(this);
  }

  onChange = (event) => {
    this.setState({ filterValue: event.target.value });
  };

  setValue(value) {
    this.setState({ searchValue: value }, () => {
      this.sendValueBack(value);
      this.toggleDropdown();
    });
  }

  toggleDropdown() {
    this.setState(prevState => ({ showDropdown: !prevState.showDropdown }));
  }

  sendValueBack(value) {
    this.props.onChange(value);
  }

  render() {
    const { showDropdown, searchValue, filterValue } = this.state;
    const { filter } = this.props;
    return (
      <div>
        <input onClick={this.toggleDropdown} style={inputStyle} value={searchValue} />
        {showDropdown && (
          <div id="answerDropdown">
            <input style={inputStyle} value={filterValue} onChange={this.onChange} />
            {filter.filter(a => filterValue && a.includes(filterValue)).map((b) => {
                return (
                  <button
                    key={shortid.generate()}
                    onClick={() => this.setValue(b)}
                    style={buttonStyle}
                  >
                    {b}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    );
  }
}

export default AnswerSearch;
