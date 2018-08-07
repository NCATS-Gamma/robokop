import React from 'react';
import { Row, Col } from 'react-bootstrap';

import ActivityTableAgGrid from './ActivityTableAgGrid';

class AdminPres extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
    };

    this.syncStateAndProps = this.syncStateAndProps.bind(this);
    this.getTableHeight = this.getTableHeight.bind(this);
  }
  componentDidMount() {
    this.syncStateAndProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.syncStateAndProps(nextProps);
  }

  getTableHeight() {
    let h = $(window).height() - 250;
    if (h < 250) {
      h = 250;
    }
    return `${h}px`;
  }

  syncStateAndProps(newProps) {
    // tasks = [
    // {
    //   "id": "72ad63eb-9ab5-4f29-b89e-7e794f062dc5",
    //   "type": "manager.tasks.update_kg",
    //   "initiator": "kenny@covar.com",
    //   "timestamp": "2018-08-06T18:27:52.076309",
    //   "question_id": "CF6g0S3SWJXA",
    //   "status": "FAILURE"
    // },...
    // ];
    let tasks = [];
    if ('tasks' in newProps && Array.isArray(newProps.tasks)) {
      tasks = newProps.tasks.map((t) => {
        t.isUserOwned = t.initiator === this.props.user.username;
        if (t.type.endsWith('update_kg')) {
          t.typeName = 'Refresh';
        } else if (t.type.endsWith('answer_question')) {
          t.typeName = 'Answer';
        } else {
          t.typeName = '?';
        }
        let ts = t.timestamp;
        if (!ts.endsWith('Z')) {
          ts = `${ts}Z`;
        }
        const d = new Date(ts);
        t.timeString = d.toLocaleString();

        return t;
      });
    }

    this.setState({ tasks });
  }

  render() {
    const nTasks = this.state.tasks.length;
    const hasTasks = nTasks > 0;

    const showTasksEmpty = !hasTasks;
    const tableHeight = this.getTableHeight();
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>
              Robokop Active Tasks
            </h1>
          </Col>
          <Col md={12}>
            {showTasksEmpty &&
              <div>
                <p>
                  There are no tasks.
                </p>
                <br />
                <br />
              </div>
            }
            {hasTasks &&
              <ActivityTableAgGrid
                tasks={this.state.tasks}
                showSearch
                onClick={this.props.onClick}
                height={tableHeight}
              />
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default AdminPres;
