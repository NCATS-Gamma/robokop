'use babel';

import React from 'react';
// import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';

const shortid = require('shortid');

class ProtocopRankingSelectorGraph extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {

    const sgp = this.props.nodeCell;
    
    // const bigList = sgp.map(p => {
    //   return (
    //     <p id={shortid.generate()}>
    //       {p.reduce((out, o) => {
    //         return out + o.reduce((line,nid) => line + ', ','')
    //     }, '')}
    //     </p>
    //   );
    // });
    const bigList = ''

    return (
      <div>
        {bigList}
      </div>
    )
  }
}

export default ProtocopRankingSelectorGraph;
