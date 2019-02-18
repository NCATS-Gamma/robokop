/* eslint-disable react/no-array-index-key */
import React, { Component } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import AppConfig from '../../../AppConfig';

const config = require('../../../../config.json');


class TaskLogs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedLog: 'manager',
    };

    // We only read the communications config on instantiation
    this.appConfig = new AppConfig(config);
    this.selectLogTab = this.selectLogTab.bind(this);
  }

  selectLogTab(tab) {
    this.setState({ selectedLog: tab });
  }

  render() {
    return (
      <Tabs
        activeKey={this.state.selectedLog}
        onSelect={this.selectLogTab}
        animation
        id="taskLogs"
        mountOnEnter
      >
        <Tab
          eventKey="manager"
          title="Manager Logs"
        >
          <div style={{ height: 250, overflow: 'scroll' }}>
            {this.props.managerLogs.substring(1, this.props.managerLogs.length - 1).split('\\n').map((log, index) => {
              const logDelimiter = log.indexOf(']') + 1;
              return <div key={`manager-${index}`}><b>{log.substring(0, logDelimiter)}</b>{log.substring(logDelimiter)}</div>;
            })}
          </div>
        </Tab>
        <Tab
          eventKey="ranker"
          title="Ranker Logs"
        >
          <div style={{ height: 250, overflow: 'scroll' }}>
            {this.props.rankerLogs.substring(1, this.props.rankerLogs.length - 1).split('\\n').map((log, index) => {
              const logDelimiter = log.indexOf(']') + 1;
              return <div key={`ranker-${index}`}><b>{log.substring(0, logDelimiter)}</b>{log.substring(logDelimiter)}</div>;
            })}
          </div>
        </Tab>
      </Tabs>
    );
  }
}

export default TaskLogs;
