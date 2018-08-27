import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

import AppConfig from '../AppConfig';

class Footer extends React.Component {
  constructor(props) {
    super(props);

    // We only read the communications config on instantiation
    this.appConfig = new AppConfig(props.config);
  }

  render() {
    return (
      <div className="footer">
        <Grid>
          <Row>
            <Col md={12}>
              <p>
                Robokop is a joint creation of <a href="www.renci.org">RENCI</a> and <a href="www.covar.com">CoVar</a> with funding from the <a href="https://ncats.nih.gov">U.S. NIH NCATS</a> as part of the <a href="https://ncats.nih.gov/translator">Biomedical Data Translator</a>
              </p>
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default Footer;
