'use babel';

import React from 'react';
import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';
import ProtocopRankingSelectorGraph from './ProtocopRankingSelectorGraph';
// import ProtocopSubGraphViewer from './ProtocopSubGraphViewer';
// import ProtocopSubGraphExplorer from './ProtocopSubGraphExplorer';

const shortid = require('shortid');

class ProtocopRankingSelector extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      mainContent: {
        height: '70vh',
        border: '1px solid #d1d1d1',
        overflow: 'hidden',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
      },
      listGroup: {
        paddingLeft: '2px',
        paddingRight: '2px',
        height: '100%',
        overflow: 'auto',
      },
      graph: {
        paddingLeft: '0',
        paddingRight: '0',
        height: '100%',
        overflow: 'auto',
      },
      explorer: {
        height: '100%',
        overflow: 'auto',
      },
    };
    this.state = {
      tableData: [{}],
      selectedSubGraphIndex: 0,
      selectedSubGraphPossibilities: [],
    };

    this.setTableData = this.setTableData.bind(this);
    this.updateSelectedSubGraphIndex = this.updateSelectedSubGraphIndex.bind(this);
    this.getSubGraphPossibilities = this.getSubGraphPossibilities.bind(this);

    this.onTableClick = this.onTableClick.bind(this);
    this.onGridReady = this.onGridReady.bind(this);
  }
  componentWillReceiveProps(newProps) {
    // this.setState({ selectedSubGraphIndex: 0, selectedSubGraphEdge: null });
    this.updateSelectedSubGraphIndex(0);
  }
  componentDidMount() {
    this.setTableData();
    //this.gridApi.sizeColumnsToFit();
  }
  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();

    // const sort = [
    //   {
    //     colId: 'name',
    //     sort: 'asc',
    //   },
    // ];
    // this.gridApi.setSortModel(sort);
  }
  onTableClick() {
    const selectedRow = this.gridApi.getSelectedRows();

    if (Array.isArray(selectedRow) && selectedRow.length > 0) {
      const board = selectedRow[0];
      this.updateSelectedSubGraphIndex(board.index);
      console.log('Clicked', board);
      // this.props.callbackRowClick(board);
    }
  }

  setTableData() {
    const tableData = this.props.ranking.map((s, ind) => {
      const isActive = ind === this.state.selectedSubGraphIndex;

      const scoreProp = s.score;
      let score = 0;
      if (!(scoreProp == null)) {
        score = scoreProp.rank_score.toFixed(4);
      }
      return {
        name: s.info.name,
        index: ind,
        isActive,
        score,
      };
    });
    this.setState({ tableData });
  }
  updateSelectedSubGraphIndex(ind) {
    const newPossibilities = this.getSubGraphPossibilities(ind);
    this.setState({ selectedSubGraphIndex: ind, selectedSubGraphPossibilities: newPossibilities });
  }
  getSubGraphPossibilities(ind) {
    const subgraph = this.props.ranking[ind];
    return subgraph.nodes.map(s => {
      const nOptions = Math.ceil(Math.random() * 5);
      const options = [];
      for (let iOption = 0; iOption < nOptions; iOption += 1) {
        options.push(shortid.generate());
      }
      return options;
    });
  }
  render() {
    return (
      <div id="ProtocopRanking_Explorer" className="col-md-12">
        <div className="row" style={this.styles.mainContent}>
          <div className={'col-md-2'} style={this.styles.listGroup}>
            <div className="ag-theme-bootstrap">
              <AgGridReact
                columnDefs={[{ headerName: 'Answers', field: 'name', suppressMenu: true }]}
                rowData={this.state.tableData}
                enableFiltering
                enableSorting

                suppressMovableColumns
                defaultColDef={{ width: 100, headerComponentParams: { template: '' } }}
                rowSelection="single"
                onSelectionChanged={this.onTableClick}
                onGridReady={this.onGridReady}
              >
                <AgGridColumn field="name" />
              </AgGridReact>
            </div>
          </div>
          <div className={'col-md-10'} style={this.styles.graph}>
            <ProtocopRankingSelectorGraph
              subgraph={this.props.ranking[this.state.selectedSubGraphIndex]}
              subgraphPossibilities={this.state.selectedSubGraphPossibilities}
            />
          </div>
          {/* <div className="col-md-4" style={this.styles.explorer}>
            {'Graph Info Goes Here.'}
          </div> */}
        </div>
      </div>
    );
  }
}

export default ProtocopRankingSelector;
