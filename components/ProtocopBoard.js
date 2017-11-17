'use babel';

import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ProtocopBoardMenu from './ProtocopBoardMenu';
import ProtocopBoardsBrowser from './ProtocopBoardsBrowser';
import ProtocopGraph from './ProtocopGraph';
import ProtocopRanking from './ProtocopRanking';

const shortid = require('shortid');

class ProtocopBoard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: 1,
    };

    this.styles = {
      button: {
        marginTop: 10,
        textAlign: 'center',
      },
      content: {
        paddingTop: 0,
      },
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    // If board is different than last time
    // Go back to tab 1
    const willGetBoard = !!nextProps.board;
    const hadBoard = !!this.props.board;
    const boardsMatch = willGetBoard && hadBoard && (nextProps.board.id === this.props.board.id);
    if (!boardsMatch) {
      this.setState({ tabKey: 1 });
    }
  }
  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }
  render() {
    const noBoard = this.props.board == null;

    let nBoardsBuilding = 0;
    if (Array.isArray(this.props.boardsBuilding)) {
      nBoardsBuilding = this.props.boardsBuilding.length;
    }

    let nBoards = 0;
    if (Array.isArray(this.props.boards)) {
      nBoards = this.props.boards.length;
    }
    const noBoards = nBoards === 0;
    const noBoardsBuilding = nBoardsBuilding === 0;
    const showBoardsBrowser = !noBoards || !noBoardsBuilding;
    const showBoard = !noBoard;
    return (
      <div id="ProtocopBoard">
        <ProtocopBoardMenu
          callbacks={this.props.callbacks}
          callbackToggleSidebar={this.props.callbackToggleSidebar}
          callbackBacktoList={this.props.callbackBacktoList}
          board={this.props.board}
        />
        { !showBoard && !showBoardsBrowser &&
          <div id="ProtocopBoard_noboards">
            <div className="row">
              <div className="col-md-10 col-md-offset-1">
                <h4>
                  {'It looks like you have an empty blackboard collection. Let\'s start a new blackboard.'}
                </h4>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 col-md-offset-4">
                <button className="btn btn-default btn-lg btn-block" type="button" onClick={this.props.callbackBlackboardNewUi}>
                  {'Start a New Blackboard'}
                </button>
              </div>
            </div>
          </div>
        }
        { !showBoard && showBoardsBrowser &&
          <div id="ProtocopBoard_noboard">
            <div className="row">
              <div className="col-md-10 col-md-offset-1">
                <h4>
                  {'Your blackboards are listed below. Select one to explore or start a new one.'}
                </h4>
              </div>
            </div>
            <ProtocopBoardsBrowser
              callbackLoadBoard={this.props.callbackLoadBoard}
              callbackBlackboardNewUi={this.props.callbackBlackboardNewUi}
              callbacks={this.props.callbacks}
              boards={this.props.boards}
              boardsBuilding={this.props.boardsBuilding}
            />
          </div>
        }
        { showBoard && // You have a board currently loaded
          // <div id="ProtocopBoard_browser" className="col-md-10 col-md-offset-1">
          <div id="ProtocopBoard_browser" className="col-md-12">
            <Tabs activeKey={this.state.tabKey} onSelect={this.handleTabSelect} id="ProtocopBoardTabs">
              <Tab eventKey={1} title="Overview">
                <ProtocopGraph
                  callbacks={this.props.callbacks}
                  board={this.props.board}
                  graph={this.props.boardGraph}
                  constructionGraph={this.props.boardConstructionGraph}
                  query={this.props.boardQuery}
                />
              </Tab>
              <Tab eventKey={2} title="Answers">
                <ProtocopRanking
                  callbacks={this.props.callbacks}
                  graph={this.props.boardGraph}
                  board={this.props.board}
                  ranking={this.props.boardRanking}
                />
              </Tab>
            </Tabs>
          </div>
        }
      </div>
    );
  }
}

export default ProtocopBoard;
