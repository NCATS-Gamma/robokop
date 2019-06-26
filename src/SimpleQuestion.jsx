import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';

class SimpleQuestion extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      user: {},
    };
  }

  componentDidMount() {
    this.appConfig.user(
      data => this.setState({
        user: data,
        ready: true,
      }),
      (err) => {
        console.log('Failed to retrieve user information. This may indicate a connection issue.');
        console.log(err);
      },
    );
  }

  render() {
    const { user, ready } = this.state;
    const { config } = this.props;
    return (
      <div>
        {ready ?
          <div>
            <Header config={config} user={user} />
            <Grid>
              <Row>
                <Col md={8}>
                  <p>Simple Question</p>
                </Col>
              </Row>
            </Grid>
            <Footer config={config} />
          </div>
        :
          <Loading />
        }
      </div>
    );
  }
}

export default SimpleQuestion;
