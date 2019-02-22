/* eslint-disable react/no-array-index-key */
import React, { Component } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import AppConfig from '../../../AppConfig';
import { config } from '../../../index';


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
    const { managerLogs, rankerLogs, logType } = this.props;
    const rankerTitle = logType.endsWith('update_kg') ? 'Builder' : 'Ranker';
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
            {managerLogs.indexOf('[') !== -1 ?
              managerLogs.substring(1, managerLogs.length - 1).split('\\n').map((log, index) => {
                const logDelimiter = log.indexOf(']') + 1;
                return <div key={`manager-${index}`}><b>{log.substring(0, logDelimiter)}</b>{log.substring(logDelimiter)}</div>;
              })
            :
              <h3>No Manager Logs Were Found</h3>
            }
          </div>
        </Tab>
        <Tab
          eventKey="ranker"
          title={`${rankerTitle} Logs`}
        >
          <div style={{ height: 250, overflow: 'scroll' }}>
            {rankerLogs.indexOf('[') !== -1 ?
              rankerLogs.substring(1, rankerLogs.length - 1).split('\\n').map((log, index) => {
                const logDelimiter = log.indexOf(']') + 1;
                return <div key={`ranker-${index}`}><b>{log.substring(0, logDelimiter)}</b>{log.substring(logDelimiter)}</div>;
              })
            :
              <h3>No {rankerTitle} Logs Were Found</h3>
            }
          </div>
        </Tab>
      </Tabs>
    );
  }
}

export default TaskLogs;
