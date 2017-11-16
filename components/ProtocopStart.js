'use babel';

import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';

class ProtocopStart extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let hidden = 'hidden';
    if (this.props.visible) {
      hidden = '';
    }
    return (
      <div id="ProtocopStart" className={`container-fluid ${hidden}`}>
        <div className="row">
          <div className="col-md-10 col-md-offset-1 text-center">
            <h1>{'PROTOCOP'}</h1>
          </div>
        </div>
        <div className="row">
          <div className="col-md-8 col-md-offset-2 ">
            <p>{'This is PROTOCOP. The Prototype version of ROBOKOP'}</p>
            <p>
              {
                '\
                In PROTOCOP, answers to your questions are stored in knowledge graphs that we call "blackboards."\
                All of the currently available blackboards are stored in a collection.\
                '
              }
            </p>
          </div>
          <div className="row" style={{ paddingTop: '10px' }}>
            <div className="col-md-4 col-md-offset-4 text-center">
              <Button bsStyle="default" bsSize="large" onClick={this.props.callbacks.collectionLoad}>
                {'Let\'s Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ProtocopStart.propTypes = {
  visible: PropTypes.bool.isRequired,
  callbacks: PropTypes.objectOf(PropTypes.func).isRequired,
};
 
export default ProtocopStart;
