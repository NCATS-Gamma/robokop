import React from 'react';
import { Row, Col } from 'react-bootstrap';

import ActivityTableAgGrid from './ActivityTableAgGrid';

const _ = require('lodash');

const timestampToDate = (ts) => {
  if (ts) {
    if (!ts.endsWith('Z')) {
      ts = `${ts}Z`;
    }
    return new Date(ts);
  }
  return null;
}

class AdminPres extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      questions: [],
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
    console.log(newProps);
    const { questions } = newProps;
    
    let tasks = [];
    /* eslint-disable no-param-reassign */
    questions.forEach((q) => {
      const qTasks = q.tasks.map((t) => {
        t.questionId = q.id;
        t.isUserOwned = t.initiator === this.props.user.user_id;
        if (t.type.endsWith('update_kg')) {
          t.typeName = 'Refresh';
        } else if (t.type.endsWith('answer_question')) {
          t.typeName = 'Answer';
        } else {
          t.typeName = '?';
        }
        t.result = JSON.parse(t.result);
        t.timestamp = timestampToDate(t.timestamp);
        t.endTimestamp = timestampToDate(t.endTimestamp);
        t.startingTimestamp = timestampToDate(t.startingTimestamp);
        t.isZombie = !t.timestamp;
        if (t.timestamp && t.startingTimestamp) {
          t.timeInQueue = t.startingTimestamp - t.timestamp;
          t.inQueue = false;
        } else {
          t.timeInQueue = Date.now() - t.startingTimestamp;
          t.inQueue = true;
        }
        if (t.timestamp && t.startingTimestamp && t.endTimestamp) {
          t.timeInProcess = t.endTimestamp - t.startingTimestamp;
          t.inProcess = false;
        } else {
          t.timeInProcess = Date.now() - t.startingTimestamp;
          t.inProcess = true;
        }
        t.isFinished = !_.isEmpty(t.result);

        if (t.inQueue) {
          t.status = 'Queued';
        } else if (t.inProcess) {
          t.status = 'Processing';
        } else if (t.isFinished) {
          t.status = 'Complete';
        } else {
          t.status = 'Zombie';
        }

        return t;
      });
      tasks = tasks.concat(qTasks);
      delete q.tasks;
    });
    /* eslint-enable no-param-reassign */

    this.setState({ tasks, questions });
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
              Robokop Activity
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
                questions={this.state.questions}
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
