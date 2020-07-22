import React from 'react';
import ReactTable from 'react-table';
import _ from 'lodash';

import AnswersetStore from '../../stores/messageAnswersetStore';
import AnswersetGraph from '../../components/answerset/AnswersetGraph';
import getNodeTypeColorMap from '../../utils/colorUtils';
import getColumnWidth from '../../utils/rtColumnWidth';

class NeightborhoodViewer extends React.Component {
  constructor(props) {
    super(props);

    this.answersetStore = new AnswersetStore(props.data);
    this.reactTable = null;

    this.state = {
      answers: [],
      columns: [],
    };

    this.openNewNodePage = this.openNewNodePage.bind(this);
  }

  componentDidMount() {
    const { concepts } = this.props;
    const answerTables = this.answersetStore.getAlphaTable(concepts);
    const { columnHeaders, answers } = answerTables;
    this.initializeState(columnHeaders, answers);
  }

  // Filter method for table columns that is case-insensitive, and matches all rows that contain
  // provided sub-string
  defaultFilterMethod(filter, row, column) { // eslint-disable-line no-unused-vars
    // console.log('filter, row, column', filter, row, column);
    let show = false;
    const key = filter.id;
    if (row[key].toLowerCase().includes(filter.value.toLowerCase())) {
      show = true;
    }
    return show;
  };

  initializeState(columnHeaders, answers) {
    const columns = this.getReactTableColumnSpec(columnHeaders, answers);
    this.setState({ answers, columns });
  }

  getReactTableColumnSpec(columnHeaders, data) {
    const { concepts } = this.props;
    const bgColorMap = getNodeTypeColorMap(concepts);
    // Take columnHeaders from store and update it as needed
    const colHeaders = columnHeaders.map((col) => {
      const colSpecObj = _.cloneDeep(col);
      const { id } = colSpecObj;
      colSpecObj.accessor = d => d.n01[0][id];
      colSpecObj.width = getColumnWidth(data, colSpecObj.accessor, colSpecObj.Header);
      return colSpecObj;
    });
    // Add Score column at the end
    colHeaders.push({
      Header: 'Rank',
      id: 'score',
      filterable: false,
      accessor: 'score',
      Cell: d => <span className="number">{parseFloat(Math.round(d.value * 1000) / 1000).toFixed(3)}</span>,
      className: 'center',
    });
    // Add Color column at the beginning
    colHeaders.unshift({
      Header: '',
      id: 'color',
      width: 10,
      filterable: false,
      accessor: d => d.n01[0].color,
      Cell: d => <div style={{ backgroundColor: bgColorMap(d.value), width: '100%', height: '100%' }} />,
      className: 'no-padding',
    });
    return colHeaders;
  }

  openNewNodePage(id) {
    const a = document.createElement('a');
    a.href = `/alpha/${id}`;
    a.setAttribute('target', '_blank');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  render() {
    const { concepts, sourceNode } = this.props;
    const { columns, answers } = this.state;
    const column = [{
      Header: `Neighbors of ${sourceNode}`,
      columns,
    }];
    return (
      <div style={{ marginBottom: '30px' }}>
        <AnswersetGraph
          store={this.answersetStore}
          concepts={concepts}
        />
        <ReactTable
          ref={(r) => { this.reactTable = r; }}
          data={answers}
          columns={column}
          defaultPageSize={10}
          defaultFilterMethod={this.defaultFilterMethod}
          pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
          minRows={10}
          filterable
          className="-highlight neighborhoodViewerReactTable"
          defaultSorted={[
            {
              id: 'score',
              desc: true,
            },
          ]}
          getTrProps={(state, rowInfo) => ({
            onClick: () => {
              this.openNewNodePage(rowInfo.row.id);
            },
          })}
        />
      </div>
    );
  }
}

export default NeightborhoodViewer;
