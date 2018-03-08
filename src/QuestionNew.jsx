import React from 'react';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';

import QuestionNewPres from './components/questionNew/QuestionNewPres';
import CardTypes from './components/questionNew/QuestionNewCardTypes';

class QuestionNew extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      user: {},
      name: '',
      description: '',
      query: [],
    };

    this.onCreate = this.onCreate.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeDescription = this.handleChangeDescription.bind(this);
    this.handleChangeQuery = this.handleChangeQuery.bind(this);
  }

  componentDidMount() {
    this.appConfig.questionNewData(data => this.setState({
      user: data.user,
      ready: true,
    }));
  }

  handleChangeName(e) {
    this.setState({ name: e.target.value });
  }
  handleChangeDescription(e) {
    this.setState({ description: e.target.value });
  }
  handleChangeQuery(newQuery) {
    // Trim off the extra meta data in the query, dependent on node type
    const slimQuery = newQuery.map((e) => {
      let meta = {};
      const type = e.displayType;
      let label = e.nodeType;
      let isBoundType = false;
      let isBoundName = false;
      switch (e.type) {
        case CardTypes.NAMEDNODETYPE:
          isBoundType = true;
          isBoundName = true;
          label = e.name;
          meta = { name: e.name };
          break;
        case CardTypes.NODETYPE:
          isBoundType = true;
          label = e.nodeType;
          break;
        case CardTypes.NUMNODES:
          label = `?[${e.numNodesMin}...${e.numNodesMax}]`;
          // type = 'Unspecified';
          meta = { numNodesMin: e.numNodesMin, numNodesMax: e.numNodesMax };
          break;
        default:
      }
      return {
        id: e.id,
        nodeSpecType: e.type,
        type,
        label,
        isBoundName,
        isBoundType,
        meta,
      };
    });

    this.setState({ query: slimQuery });
  }

  onCreate() {
    const newBoardInfo = {
      name: this.state.name,
      description: this.state.description,
      query: this.state.query,
    };

    this.appConfig.questionNew(newBoardInfo, data => {
      window.location.href = this.appConfig.urls.question(data);
    });
  }
    
  onSearch(postData) {
    this.appConfig.questionNewSearch(postData);
  }
  onValidate(postData) {
    this.appConfig.questionNewValidate(postData);
  }
  onTranslate(postData) {
    this.appConfig.questionNewTranslate(postData);
  }
  onCancel() {
    window.history.back();
  }

  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <QuestionNewPres
          query={this.state.query}
          handleChangeName={this.handleChangeName}
          handleChangeDescription={this.handleChangeDescription}
          handleChangeQuery={this.handleChangeQuery}
          callbackCreate={this.onCreate}
          callbackSearch={this.onSearch}
          callbackValidate={this.onValidate}
          callbackTranslate={this.onTranslate}
          callbackCancel={this.onCancel}
        />
      </div>
    );
  }
  render() {
    return (
      <div>
        {!this.state.ready && this.renderLoading()}
        {this.state.ready && this.renderLoaded()}
      </div>
    );
  }
}

export default QuestionNew;
