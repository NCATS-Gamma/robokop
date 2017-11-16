'use babel';

import React from 'react';
import Sidebar from 'react-sidebar';
import ProtocopSideBar from './ProtocopSideBar';
import ProtocopNewBoard from './ProtocopNewBoard';
import ProtocopBoard from './ProtocopBoard';

class ProtocopMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sidebarVisible: false,
      visible: { new: false, board: true }, // By default we show the board editor with no board
    };

    this.visibleStateFalse = { new: false, board: false };
    this.sidebarStyles = {
      sidebar: {
        zIndex: 1100,
        width: '750px',
      },
      overlay: {
        zIndex: 1099,
        backgroundColor: '#d3d3d3',
      },
    };

    this.callbackLoadBoard = this.callbackLoadBoard.bind(this);
    this.callbackCancelNewEditor = this.callbackCancelNewEditor.bind(this);
    this.callbackOpenNewEditor = this.callbackOpenNewEditor.bind(this);
    this.callbackCreateNew = this.callbackCreateNew.bind(this);
    this.callbackBacktoList = this.callbackBacktoList.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // If board is different than last time
    // Close the sidebar
    const willGetBoard = !!nextProps.board;
    const hadBoard = !!this.props.board;
    const boardsMatch = willGetBoard && hadBoard && (nextProps.board.id === this.props.board.id);
    if (!boardsMatch) {
      this.setState({ sidebarVisible: false });
    }
  }
  toggleSidebar() {
    this.setState({ sidebarVisible: !this.state.sidebarVisible });
  }
  callbackBacktoList() {
    const newVisibleState = { new: false, board: true };
    this.setState({ visible: newVisibleState }, () => this.props.callbacks.blackboardUnLoad());
  }
  callbackLoadBoard(board) {
    const newVisibleState = { new: false, board: true };
    this.setState({ visible: newVisibleState }, () => this.props.callbacks.blackboardLoad(board));
  }
  callbackCancelNewEditor() {
    const newVisibleState = { new: false, board: true };
    this.setState({ visible: newVisibleState });
  }
  callbackOpenNewEditor() {
    const newVisibleState = { new: true, board: false };
    this.setState({ visible: newVisibleState, sidebarVisible: false });
  }
  callbackCreateNew(newBoardInfo) {
    const newVisibleState = { new: false, board: true };
    this.props.callbacks.blackboardBuild(newBoardInfo);
    this.setState({ visible: newVisibleState });
  }
  render() {
    let hidden = 'hidden';
    if (this.props.visible) {
      hidden = '';
    }
    return (
      <div id="ProtocopMain" className={`container ${hidden}`}>
        <Sidebar
          sidebar={
            <ProtocopSideBar
              callbacks={this.props.callbacks}
              callbackLoadBoard={this.callbackLoadBoard}
              boards={this.props.boards}
            />
          }
          open={this.state.sidebarVisible}
          onSetOpen={this.toggleSidebar}
          sidebarClassName={'sidebar'}
          styles={this.sidebarStyles}
        >
          { this.state.visible.new &&
          <ProtocopNewBoard
            callbackCancel={this.callbackCancelNewEditor}
            callbackCreate={this.callbackCreateNew}
          />
          }
          { this.state.visible.board &&
          <ProtocopBoard
            boards={this.props.boards}
            boardsBuilding={this.props.boardsBuilding}
            board={this.props.board}
            boardGraph={this.props.boardGraph}
            boardConstructionGraph={this.props.boardConstructionGraph}
            boardQuery={this.props.boardQuery}
            boardRanking={this.props.boardRanking}
            callbacks={this.props.callbacks}
            callbackLoadBoard={this.callbackLoadBoard}
            callbackBacktoList={this.callbackBacktoList}
            callbackBlackboardNewUi={this.callbackOpenNewEditor}
            callbackToggleSidebar={this.toggleSidebar}
          />
          }
        </Sidebar>
      </div>
    );
  }
}

export default ProtocopMain;
