import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Button, Media } from 'react-bootstrap';
import GoPlaybackPlay from 'react-icons/lib/go/playback-play';

import Loading from '../Loading';

class AnswersetSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedId: null,
      showOverlay: true,
    };
  }

  componentDidMount() {
    let selectedId = null;
    let showOverlay = true;
    if (this.props.answersets.length > 0) {
      selectedId = this.props.answersets[0].id;
      showOverlay = false;
    }
    this.setState({ selectedId, showOverlay });
  }
  getMainContent() {
    return (
      <Media>
        <Media.Left>
          <img width={64} height={64} src="/thumbnail.png" alt="thumbnail" />
        </Media.Left>
        <Media.Body>
          <Media.Heading>Media Heading</Media.Heading>
          <p>
            Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque
            ante sollicitudin commodo. Cras purus odio, vestibulum in vulputate at,
            tempus viverra turpis. Fusce condimentum nunc ac nisi vulputate
            fringilla. Donec lacinia congue felis in faucibus.
          </p>
        </Media.Body>
      </Media>
    );
  }

  renderOverlay() {
    return (
      <div>
        <h4>
          Getting Initial Answerset please wait.
        </h4>
        <Loading />
      </div>
    );
  }
  renderStandard() {
    const { showNewButton } = this.props;

    return (
      <div>
        <div style={{ position: 'relative' }}>
          {`${this.props.answersets.length} Different Answer Sets Available:`}
          
          {showNewButton &&
            <div className="pull-right" style={{ position: 'absolute', right: 0, top: 0 }}>
              <Button
                bsSize="small"
                alt="Get a New Answer Set"
                onClick={this.props.callbackAnswersetNew}
              >
                <GoPlaybackPlay />
              </Button>
            </div>
          }
        </div>
        {this.getMainContent()}
      </div>
    );
  }
  render() {
    return (
      <div>
        {this.state.showOverlay &&
          this.renderOverlay()
        }
        {!this.state.showOverlay &&
          this.renderStandard()
        }
      </div>
    );
  }
}

export default AnswersetSelector;
