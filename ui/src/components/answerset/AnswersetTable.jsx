import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { FaExternalLink } from 'react-icons/fa';
import ReactTable from 'react-table';
import ReactJson from 'react-json-view';

import entityNameDisplay from './../util/entityNameDisplay';
import { initializeStructureGroup } from './AnswersetInteractive';
import { answerSetTabEnum } from './AnswersetPres';

const _ = require('lodash');

// Filter method for table columns that is case-insensitive, and matches all rows that contain
// provided sub-string
const defaultFilterMethod = (filter, row) => {
  const id = filter.pivotId || filter.id;
  return row[id] !== undefined ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase()) : true;
};

// Subcomponent for custom detailed view for each answer in the table row
const subComponent = (rowInfo) => {
  const rowData = _.cloneDeep(rowInfo.original);
  // delete rowData.result_graph.edge_list;
  return (
    <div style={{
      margin: '20px', border: '1px solid #ededed', padding: '20px', boxShadow: '0px 0px 5px 0px #ececec',
      }}
    >
      <ReactJson
        name={false}
        theme="rjv-default"
        collapseStringsAfterLength={110}
        indentWidth={2}
        iconStyle="triangle"
        src={rowData}
        displayDataTypes={false}
        collapsed={4}
      />
    </div>
  );
};


@observer
class AnswersetTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groups: [],
      isError: false,
      error: null,
    };
    this.initStructureGroup = this.initStructureGroup.bind(this);
  }
  componentDidMount() {
    this.initStructureGroup();
  }

  getAnswerIndexById(answerId) {
    let selectedGroupIndex = null;
    let selectedGroupWithinIndex = null;
    this.state.groups.forEach((g, groupIndex) => {
      const thisSubGroupAnswerIndex = g.answers.findIndex(a => a.id === answerId);
      if (thisSubGroupAnswerIndex >= 0) {
        selectedGroupWithinIndex = thisSubGroupAnswerIndex;
        selectedGroupIndex = groupIndex;
      }
    });

    return [selectedGroupIndex, selectedGroupWithinIndex];
  }

  initStructureGroup() {
    const groupsObj = initializeStructureGroup(this.props.answers);
    this.setState(groupsObj);
  }

  renderError() {
    console.log('Interactive Viewer Error Message', this.state.error);
    return (
      <Row>
        <Col md={12}>
          <h4>
            {'Sorry but we ran in to problems setting up the interactive viewer for this answer set.'}
          </h4>
          <p>
            Error Message:
          </p>
          <pre>
            {this.state.error.message}
          </pre>
        </Col>
      </Row>
    );
  }
  renderNoAnswers() {
    return (
      <Row>
        <Col md={12}>
          {'There does not appear to be any answers for this question.'}
        </Col>
      </Row>
    );
  }
  renderValid() {
    const { store } = this.props;
    const answerTables = this.state.groups.map((group, groupInd) => {
      if (group.isValid) {
        const tempAnswer = group.answers[0];
        const innerColumns = tempAnswer.result_graph.node_list.map((n, i) => (
          {
            Header: entityNameDisplay(n.type),
            accessor: `result_graph.node_list[${i}].name`,
          }
        ));
        innerColumns.push({
          Header: 'Rank',
          id: 'confidence',
          width: 75,
          filterable: false,
          accessor: 'confidence',
          Cell: d => <span className="number">{parseFloat(Math.round(d.value * 1000) / 1000).toFixed(3)}</span>,
          className: 'center',
        });
        innerColumns.push({
          Header: 'Link',
          width: 60,
          filterable: false,
          Cell: () => <FaExternalLink />,
          className: 'center',
          style: { alignSelf: 'center', cursor: 'pointer' },
        });
        const columns = [{
          Header: `Answer Group ${groupInd + 1}`,
          columns: innerColumns,
        }];
        return (
          <div key={group.connectivityHash} style={{ marginBottom: '10px' }}>
            <ReactTable
              data={group.answers}
              columns={columns}
              defaultPageSize={10}
              defaultFilterMethod={defaultFilterMethod}
              pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
              minRows={5}
              filterable
              className="-striped -highlight"
              SubComponent={subComponent}
              getTdProps={(state, rowInfo, column, instance) => {
                return {
                  onClick: (e, handleOriginal) => {
                    // console.log('A Td Element was clicked!');
                    // console.log('it produced this event:', e);
                    // console.log('It was in this column:', column);
                    // console.log('It was in this row:', rowInfo);
                    // console.log('It was in this table instance:', instance);
                    // IMPORTANT! React-Table uses onClick internally to trigger
                    // events like expanding SubComponents and pivots.
                    // By default a custom 'onClick' handler will override this functionality.
                    // If you want to fire the original onClick handler, call the
                    // 'handleOriginal' function.
                    if (handleOriginal) {
                      handleOriginal();
                    }
                    // Only trigger view of answer if clicking in the "Link" column
                    if (column.Header === 'Link') {
                      const answerId = rowInfo.original.id;
                      store.updateSelectedByAnswerId(answerId);
                      this.props.callbackAnswerSelected({ id: answerId });
                      this.props.handleTabSelect(answerSetTabEnum.answerList);
                    }
                  },
                };
              }}
              // style={{ height: '480px' }}
            />
          </div>
        );
      }
    });
    return (
      <div>
        {answerTables}
      </div>
    );
  }
  renderInvalid() {
    return (
      <Col md={12}>
        <p>
          Due to the complexity of the answer graphs, the interactive browser is unavailable.
        </p>
      </Col>
    );
  }
  renderGroup() {
    const isValid = this.state.groups.reduce((acc, c) => acc || c, false); // Valid if any valid answergroup exists

    // const selectOptions = this.state.groups.map((g, i) => ({ value: i, label: `${i + 1} - ${g.answers.length} answers each with ${g.nNodes} nodes.` }));
    // const oneGroup = selectOptions.length === 1;

    return (
      <Row>
        <Col md={12}>
          {/* {!oneGroup &&
            <Row>
              <Col md={12}>
                <Panel style={{ margin: '10px 0 0px 0' }}>
                  <Panel.Heading>
                    <Panel.Title componentClass="h3">Multiple Answer Structures Found</Panel.Title>
                  </Panel.Heading>
                  <Panel.Body>
                    <Col md={6}>
                      <p>
                        The interactive viewer supports a single structure at a time. Please select a structure group to explore.
                      </p>
                    </Col>
                    <Col md={6}>
                      <Select
                        name="structure_select"
                        value={selectOptions[this.state.groupSelection].value}
                        onChange={this.onGroupSelectionChange}
                        options={selectOptions}
                        clearable={false}
                      />
                    </Col>
                  </Panel.Body>
                </Panel>
              </Col>
            </Row>
          } */}
          <Row style={{ marginTop: '10px' }}>
            {isValid && this.renderValid()}
            {!isValid && this.renderInvalid()}
          </Row>
        </Col>
      </Row>
    );
  }
  render() {
    const { isError } = this.state;
    const hasAnswers = (this.state.groups.length > 0 && this.state.groups[0] && this.state.groups[0].answers.length > 0);

    return (
      <div>
        {isError && this.renderError()}
        {!isError && hasAnswers && this.renderGroup()}
        {!isError && !hasAnswers && this.renderNoAnswers()}
      </div>
    );
  }
}

AnswersetTable.defaultProps = {
  answersetFeedback: [],
};

export default AnswersetTable;
