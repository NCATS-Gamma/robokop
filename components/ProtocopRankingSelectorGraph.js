'use babel';

import React from 'react';
// import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';

const shortid = require('shortid');

class ProtocopRankingSelectorGraph extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {

    const sgp = this.props.subgraphPossibilities;
    
    const bigList = sgp.map(p => {
      return (
        <p id={shortid.generate()}>
          {p.reduce((out, o) => out + ', ' + o, '')}
        </p>
      );
    });

    return (
      <div>
        {bigList}
      </div>
    )
  }
}

export default ProtocopRankingSelectorGraph;
