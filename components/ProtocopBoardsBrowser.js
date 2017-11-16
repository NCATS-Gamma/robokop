'use babel';

import React from 'react';
import { Button, Table, Glyphicon } from 'react-bootstrap';

const shortid = require('shortid');

class ProtocopBoardsBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.generateBoardsRows = this.generateBoardsRows.bind(this);
    this.generateBoardsBuildingRows = this.generateBoardsBuildingRows.bind(this);
    this.generateBoardsContent = this.generateBoardsContent.bind(this);
    this.generateBoardsBuildingContent = this.generateBoardsBuildingContent.bind(this);
  }

  generateBoardsRows(boards) {
    return boards.map((b) => {
      return [
        <tr key={shortid.generate()} onClick={() => this.props.callbackLoadBoard(b)} style={{ cursor: 'pointer' }}>
          <td>
            {b.name}
          </td>
        </tr>,
      ];
    });
  }

  generateBoardsBuildingRows(boards) {
    return boards.map((b) => {
      return [
        <tr key={shortid.generate()}>
          <td>
            {b.name}
          </td>
        </tr>,
      ];
    });
  }

  generateBoardsContent(boards) {
    return [
      <div key={shortid.generate()}>
        <h5>{'Blackboards in this Collection'}</h5>
        <p>{'Select one to explore.'}</p>
        <Table striped bordered condensed hover>
          {/* <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead> */}
          <tbody>
            {this.generateBoardsRows(boards, true)}
          </tbody>
        </Table>
      </div>,
    ];
  }
  generateBoardsBuildingContent(boards) {
    if (boards == null || boards.length === 0) {
      return [
        <div key={shortid.generate()}>
          <h5>{'Blackboards under Construction'}</h5>
          <p>{'There are currently no blackboards under construction.'}</p>
          <Button bsStyle={'default'} bsSize={'large'} onClick={this.props.callbackBlackboardNewUi}>
            {'Start a new Blackboard'}
          </Button>
        </div>,
      ];
    }
    return [
      <div key={shortid.generate()}>
        <h5>{'Blackboards under Construction'}</h5>
        <p>{'We are current building these blackboards:'}</p>
        <Table striped bordered condensed hover>
          {/* <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead> */}
          <tbody>
            {this.generateBoardsBuildingRows(boards)}
          </tbody>
        </Table>
        <Button bsStyle={'default'} bsSize={'large'} onClick={this.props.callbackBlackboardNewUi}>
            {'Start another Blackboard'}
        </Button>
      </div>,
    ];
  }

  render() {
    const boardsBuildingFrag = this.generateBoardsBuildingContent(this.props.boardsBuilding);
    const boardsFrag = this.generateBoardsContent(this.props.boards);

    return (
      <div className="row">
        <div className="col-md-7 col-md-offset-1">
          <div style={{ height: '100%', overflowY: 'scroll' }}>
            {boardsFrag}
          </div>
        </div>
        <div className="col-md-3">
          <div style={{ height: '100%', overflowY: 'scroll' }}>
            {boardsBuildingFrag}
          </div>
        </div>
      </div>
    );
  }
}

export default ProtocopBoardsBrowser;
