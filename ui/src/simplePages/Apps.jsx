import React from 'react';

import { Grid, Row, Col, Panel } from 'react-bootstrap';

import AppConfig from '../AppConfig';
import Loading from '../components/Loading';
import Header from '../components/Header';
import Footer from '../components/Footer';

class Apps extends React.Component {
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
      data =>
        this.setState({
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
    const backgroundColor = this.appConfig.colors.bluegray;
    return (
      <div>
        {ready ? (
          <div>
            <Header config={this.props.config} user={user} />
            <Grid>
              <Row>
                <Col md={12}>
                  <h2>Apps</h2>
                  <Panel style={{ padding: 20, backgroundColor }}>
                    <h3>Search</h3>
                    <a href={this.appConfig.urls.search}>Search - <small>Find Identifiers for Biomedical Concepts</small></a>
                  </Panel>
                  <Panel style={{ padding: 20, backgroundColor }}>
                    <h3>Answerset Explorer</h3>
                    <a href={this.appConfig.urls.view}>Answer Set Explorer - <small>Use the Robokop UI with answer set files.</small></a>
                  </Panel>
                  <Panel style={{ padding: 20, backgroundColor }}>
                    <h3>Simple Question</h3>
                    <a href={this.appConfig.urls.simpleQuestion}>Simple Question - <small>Ask a simple question and get answers back. This question will not be stored in the database and you don&apos;t have to be signed in to ask a simple question.</small></a>
                  </Panel>
                  <Panel style={{ padding: 20, backgroundColor }}>
                    <h3>Expand</h3>
                    <a href={this.appConfig.urls.expand}>Simple Expand - <small>Use the Robokop Expand API.</small></a>
                  </Panel>
                  <Panel style={{ padding: 20, backgroundColor }}>
                    <h3>Enrich</h3>
                    <a href={this.appConfig.urls.enrich}>Simple Enriched - <small>Use the Robokop Enriched API.</small></a>
                  </Panel>
                  <Panel style={{ padding: 20, backgroundColor }}>
                    <h3>Similarity</h3>
                    <a href={this.appConfig.urls.similarity}>Simple Similarity - <small>Use the Robokop Similarity API.</small></a>
                  </Panel>
                  <Panel style={{ padding: 20, backgroundColor }}>
                    <h3>Synonymize</h3>
                    <a href={this.appConfig.urls.synonymize}>Simple Synonymize - <small>Use the Robokop Synonymize API.</small></a>
                  </Panel>
                </Col>
              </Row>
            </Grid>
            <Footer config={this.props.config} />
          </div>
        ) : (
          <Loading />
        )}
      </div>
    );
  }
}

export default Apps;
