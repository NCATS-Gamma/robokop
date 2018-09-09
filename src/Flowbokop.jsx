import React from 'react';
import PropTypes from 'prop-types';

import FlowbokopGraphFetchAndView, { graphStates } from './components/flowbokop/FlowbokopGraphFetchAndView';


const demoGraph = {
  "nodes": [
    {
      "id": 0,
      "name": "usher1",
      "operation": {}
    },
    {
      "id": 1,
      "name": "usher2",
      "operation": {}
    },
    {
      "id": 2,
      "name": "usher1_genes",
      "operation": {
        "service": "http://127.0.0.1/api/flowbokop/expand/disease/gene/",
        "options": null
      }
    },
    {
      "id": 3,
      "name": "usher2_genes",
      "operation": {
        "service": "http://127.0.0.1/api/flowbokop/expand/disease/gene/",
        "options": null
      }
    },
    {
      "id": 4,
      "name": "common_genes",
      "operation": {
        "service": "http://127.0.0.1/api/flowbokop/intersection/",
        "options": null
      }
    }
  ],
  "edges": [
    {
      "source_id": 0,
      "target_id": 2
    },
    {
      "source_id": 1,
      "target_id": 3
    },
    {
      "source_id": 2,
      "target_id": 4
    },
    {
      "source_id": 3,
      "target_id": 4
    }
  ]
};

class Flowbokop extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <FlowbokopGraphFetchAndView
          graph={demoGraph}
          graphState={graphStates.fetching}
          height='350px'
          // width={700}
        />
      </div>
    )
  }
}

export default Flowbokop;
