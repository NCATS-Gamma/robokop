import React from 'react';
import PropTypes from 'prop-types';

import { Grid } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import ActivityPres from './components/activity/ActivityPres';
import TasksModal from './components/shared/modals/TasksModal';

class Activity extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      dataReady: false,
      hadError: false,
      user: {},
      questions: [],
      task: {},
      showModal: false,
    };

    this.callbackTaskStop = this.callbackTaskStop.bind(this);
    this.refreshTasks = this.refreshTasks.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    this.refreshTasks();
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }
  refreshTasks() {
    this.appConfig.questionList(
      (data) => {
        this.setState({
          questions: data.data.questions,
          dataReady: true,
          hadError: false,
        });
      },
      (err) => {
        console.log('Error getting question list:', err);
        this.setState({
          questions: [],
          dataReady: false,
          hadError: true,
        });
      },
    );
  }
  callbackTaskStop(task) {
    this.setState({ task }, () => {
      this.toggleModal();
    });
  }

  toggleModal() {
    this.setState(prevState => ({ showModal: !prevState.showModal }));
  }

  renderError() {
    return (
      <h2>
        There was a problem contacting the server.
      </h2>
    );
  }
  render() {
    const ready = this.state.userReady;
    return (
      <div>
        {ready ?
          <div>
            <Header
              config={this.props.config}
              user={this.state.user}
            />
            {!this.state.dataReady && !this.state.hadError &&
              <Loading />
            }
            {!this.state.dataReady && this.state.hadError &&
              this.renderError()
            }
            {this.state.dataReady &&
              <Grid>
                <ActivityPres
                  user={this.state.user}
                  questions={this.state.questions}
                  onClick={this.callbackTaskStop}
                />
              </Grid>
            }
            <Footer config={this.props.config} />
            <TasksModal task={this.state.task} user={this.state.user} showModal={this.state.showModal} toggleModal={this.toggleModal} />
          </div>
          :
          <p />
        }
      </div>
    );
  }
}

Activity.propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
};

export default Activity;
