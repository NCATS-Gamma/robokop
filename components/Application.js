'use babel';

import React from 'react';
import ProtocopMain from './ProtocopMain';
import ProtocopStart from './ProtocopStart';
import Message from './Message';

/* Application is the main driver for the application pages and defines
   single-page application.
*/
class Application extends React.Component {
  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = {
      visible: { main: false, start: false, message: true }, // Message true here so we display the starting up message
      serverReady: false,

      message_title: 'Starting Up...',
      message_text: 'Please wait a moment.',
      message_showButton: false,
      message_showProgress: true,
      message_buttonText: 'OK',
      message_buttonCallback: function empty() { },
      message_returnVisibleState: {},

      boards: [],
      boardsBuilding: [],
      boardsBuildingPrevious: [],
      board: null,
      boardQuery: null,
      boardGraph: null,
      boardConstructionGraph: null,
      boardRanking: null,

      buildingPolling: false,
      buildingPollingInterval: 5000, // in ms (every 5s seems sufficient)
      buildingPollingJob: {}, // This is the output of setInterval
    };

    this.callbacks = {
      onStart: this.onStart.bind(this),
      onMain: this.onMain.bind(this),

      onMessage: this.onMessage.bind(this),
      onMessageOk: this.onMessageOk.bind(this),
      onMessageOkRetainReturn: this.onMessageOkRetainReturn.bind(this),
      offMessage: this.offMessage.bind(this),
      onMessageProgressWithAfter: this.onMessageProgressWithAfter.bind(this),
      onMessageProgress: this.onMessageProgress.bind(this),

      collectionLoad: this.collectionLoad.bind(this),
      blackboardNewUi: this.blackboardNewUi.bind(this),
      blackboardBuild: this.blackboardBuild.bind(this),
      blackboardLoad: this.blackboardLoad.bind(this),
      blackboardUnLoad: this.blackboardUnLoad.bind(this),
      blackboardRank: this.blackboardRank.bind(this),

      blackboardsBuildingAdd: this.blackboardsBuildingAdd.bind(this),
      blackboardsBuildingRemove: this.blackboardsBuildingAdd.bind(this),
      blackboardComplete: this.blackboardsBuildingAdd.bind(this),
    };

    this.blackboardsBuildingStartPolling = this.blackboardsBuildingStartPolling.bind(this);
    this.blackboardsBuildingPoll = this.blackboardsBuildingPoll.bind(this);

    this.visibleStateFalse = { main: false, start: false, message: false };
  }

  componentDidMount() {
    this.mounted = true;
    // console.log('Application loaded.');
    this.onStart();
  }
  onStart() {
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.start = true;
    this.setState({ visible: visibleState });
  }
  onMain() {
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.main = true;
    this.setState({ visible: visibleState }, this.blackboardsBuildingStartPolling);
    // Make sure we are looking for new boards
  }
  onMessage(title, text) {
    const returnVisibleState = Object.assign({}, this.state.visible);
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.message = true;
    this.setState({
      visible: visibleState,
      message_returnVisibleState: returnVisibleState,
      message_title: title,
      message_text: text,
      message_showButton: false,
      message_showProgress: false,
      message_buttonText: 'OK',
    });
  }
  onMessageProgress(title, text) {
    const returnVisibleState = Object.assign({}, this.state.visible);
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.message = true;

    this.setState({
      visible: visibleState,
      message_returnVisibleState: returnVisibleState,
      message_title: title,
      message_text: text,
      message_showButton: false,
      message_showProgress: true,
      message_buttonText: 'OK',
    });
  }
  onMessageProgressWithAfter(title, text, after) {
    const returnVisibleState = Object.assign({}, this.state.visible);
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.message = true;
    this.setState({
      visible: visibleState,
      message_returnVisibleState: returnVisibleState,
      message_title: title,
      message_text: text,
      message_showButton: false,
      message_showProgress: true,
      message_buttonText: 'OK',
    }, after);
  }
  onMessageOk(title, text, buttonText) {
    const returnVisibleState = Object.assign({}, this.state.visible);
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.message = true;
    this.setState({
      visible: visibleState,
      message_returnVisibleState: returnVisibleState,
      message_title: title,
      message_text: text,
      message_showButton: true,
      message_showProgress: false,
      message_buttonText: buttonText,
      message_buttonCallback: this.callbacks.offMessage,
    });
  }
  onMessageOkCallback(title, text, buttonText, callback) {
    const returnVisibleState = Object.assign({}, this.state.visible);
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.message = true;
    this.setState({
      visible: visibleState,
      message_returnVisibleState: returnVisibleState,
      message_title: title,
      message_text: text,
      message_showButton: true,
      message_showProgress: false,
      message_buttonText: buttonText,
      message_buttonCallback: callback,
    });
  }
  onMessageOkRetainReturn(title, text, buttonText) {
    const visibleState = Object.assign({}, this.visibleStateFalse);
    visibleState.message = true;
    this.setState({
      visible: visibleState,
      message_title: title,
      message_text: text,
      message_showButton: true,
      message_showProgress: false,
      message_buttonText: buttonText,
      message_buttonCallback: this.callbacks.offMessage,
    });
  }
  offMessage() {
    const visibleState = this.state.message_returnVisibleState;
    this.setState({ visible: visibleState });
  }
  getUrl(ext) {
    const out = `http://${this.props.host}:${this.props.port}/${ext}`;
    return out;
  }
  collectionLoad() {
    this.onMessageProgress('Loading Blackboard Collection...', 'Please wait.');

    const postData = { };
    $.post(this.getUrl('collection/load'), postData, (data) => {
      const newData = {
        boards: data.boards,
      };
      this.setState(newData, this.onMain);
    }).fail((err) => {
      this.callbacks.onMessageOkRetainReturn('There was a problem communicating with the webserver ....', err.responseText, 'Ok');
    });
  }
  collectionLoadBackground() {
    const postData = { };
    $.post(this.getUrl('collection/load'), postData, (data) => {
      const newData = {
        boards: data.boards,
      };
      this.setState(newData);
    }).fail((err) => {
      this.callbacks.onMessageOkRetainReturn('There was a problem communicating with the webserver ....', err.responseText, 'Ok');
    });
  }
  blackboardNewUi() {
    this.onMain();
    this.blackboardUnLoad();
    this.mainComponent.callbackOpenNewEditor();
    // We need to change the view here to main and then call
    // ProtocopMain.callbackOpenNewEditor()
  }
  blackboardsBuildingStartPolling() {
    if (!(this.state.buildingPolling)) {
      const pollingJob = setInterval(this.blackboardsBuildingPoll, this.state.buildingPollingInterval);

      this.setState({ buildingPolling: true, buildingPollingJob: pollingJob });
    }
  }
  blackboardsBuildingPoll() {
    // Make a request to fetch all of the boards currently under construction
    $.get(this.getUrl('blackboard/building'), (data) => {
      const boardsBuilding = data.boards;
      console.log(boardsBuilding);
      this.setState({ boardsBuilding });
    }).fail((err) => {
      this.callbacks.onMessageOkRetainReturn('There was a problem communicating with the webserver ....', err.responseText, 'Ok');
    });
  }
  blackboardBuild(newBoardInformation) {
    // Send message to server to start building the process
    // Update list of boards to include a board in progress
    // this.mainComponent.callbackOpenNewEditor();
    this.onMessageProgress('Starting blackboard builder...', 'Please wait.');

    // Tell server to spawn the process
    const postData = {
      id: newBoardInformation.id,
      name: newBoardInformation.name,
      description: newBoardInformation.description,
      query: JSON.stringify(newBoardInformation.query),
    };
    $.post(this.getUrl('blackboard/build'), postData, (data) => {
      const failure = data.failure;
      if (failure) {
        this.callbacks.onMessageOkRetainReturn('There was a problem starting the blackboard builder.', 'Sorry', ':(');
      } else {
        this.callbacks.onMessageOkRetainReturn('Blackboard construction is underway.', 'Depending on the query it can take a while. We will let you know when it\'s ready.', 'OK');
      }
    }).fail((err) => {
      this.callbacks.onMessageOkRetainReturn('There was a problem communicating with the webserver ....', err.responseText, 'Ok');
    });
  }
  blackboardComplete(newBoard) {
    this.blackboardsBuildingRemove(newBoard);
    this.collectionLoad();
    this.onMessageOkCallback('Blackboard Complete!', 'Your blackboard is complete. Would you like to explore it now?', ['Explore Now', 'Maybe Later'], [() => this.callbacks.blackboardLoad(newBoard), this.callbacks.offMessage]);
  }
  blackboardsBuildingRemove(doneBoard) {
    const boardsBuilding = this.state.boardsBuilding;
    const removeInd = boardsBuilding.findIndex(b => b.id === doneBoard.id);
    boardsBuilding.splice(removeInd, 1);
    this.setState({ boardsBuilding });
  }
  blackboardsBuildingAdd(newBoard) {
    const boardsBuilding = this.state.boardsBuilding;
    boardsBuilding.push(newBoard);
    this.setState({ boardsBuilding });
  }
  blackboardUnLoad() {
    const newData = {
      board: null,
      boardQuery: null,
      boardGraph: null,
      boardConstructionGraph: null,
      boardRanking: null,
    };
    this.setState(newData);
  }
  blackboardLoad(board) {
    this.onMessageProgress('Loading Blackboard...', 'Please wait.');

    const postData = { id: board.id };
    $.post(this.getUrl('blackboard/load'), postData, (data) => {
      const newData = {
        board,
        boardQuery: data.query,
        boardGraph: data.graph,
        boardConstructionGraph: data.constructionGraph,
        boardRanking: null,
      };
      this.setState(newData, this.callbacks.offMessage);
    }).fail((err) => {
      this.callbacks.onMessageOkRetainReturn('There was a problem communicating with the webserver ....', err.responseText, 'Ok');
    });
  }
  blackboardRank() {
    this.onMessageProgress('Ranking Potential Answers...', 'This may take a moment. Please wait.');

    const postData = { id: this.state.board.id };
    $.post(this.getUrl('blackboard/rank'), postData, (data) => {
      this.setState({ boardRanking: data.ranking }, this.offMessage);
    }).fail((err) => {
      this.callbacks.onMessageOkRetainReturn('There was a problem communicating with the webserver ....', err.responseText, 'Ok');
    });
  }

  render() {
    return (
      <div>
        <ProtocopStart
          visible={this.state.visible.start}
          callbacks={this.callbacks}
        />
        <ProtocopMain
          ref={(r) => { this.mainComponent = r; }}
          visible={this.state.visible.main}
          boards={this.state.boards}
          boardsBuilding={this.state.boardsBuilding}
          board={this.state.board}
          boardGraph={this.state.boardGraph}
          boardConstructionGraph={this.state.boardConstructionGraph}
          boardQuery={this.state.boardQuery}
          boardRanking={this.state.boardRanking}
          callbacks={this.callbacks}
          modalIsOpen={this.state.modalIsOpen}
          modalData={this.state.modalData}
          modalRank={this.state.modalRank}
        />
        <Message
          visible={this.state.visible.message}
          text={this.state.message_text}
          title={this.state.message_title}
          showButton={this.state.message_showButton}
          showProgress={this.state.message_showProgress}
          buttonText={this.state.message_buttonText}
          buttonCallback={this.state.message_buttonCallback}
        />
      </div>
    );
  }
}

export default Application;
