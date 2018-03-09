import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Button } from 'react-bootstrap';
import GoPlaybackPlay from 'react-icons/lib/go/playback-play';

import AnswersetGrid from '../shared/AnswersetGrid';


class AnswersetBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      container: {
        border: '1px solid #d1d1d1',
        boxShadow: '0px 0px 5px #c3c3c3',
        // margin: 'auto',
        // padding: '10px',
        // display: 'flex',
        // alignItems: 'center',
        // justifyContent: 'center',
      },
    };
  }

  render() {
    return (
      <Row>
        <Col md={2}>
          <h4>Answer Sets</h4>
          <Button onClick={this.props.callbackAnswersetNew} >Get Another Answer Set <br /> <GoPlaybackPlay /></Button>
        </Col>
        <Col md={10}>
          <div style={this.styles.container}>
            <AnswersetGrid
              answersets={this.props.answersets}
              callbackAnswersetOpen={this.props.callbackAnswersetOpen}
            />
          </div>
        </Col>
      </Row>
    );
  }
}

AnswersetBrowser.defaultProps = {
  height: '125px',
};

AnswersetBrowser.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  answersets: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  callbackAnswersetOpen: PropTypes.func.isRequired,
  callbackAnswersetNew: PropTypes.func.isRequired,
};

export default AnswersetBrowser;
