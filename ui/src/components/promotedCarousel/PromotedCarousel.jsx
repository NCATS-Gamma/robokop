/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Jumbotron, Button, Carousel } from 'react-bootstrap';

import './promotedCarousel.css';

import QuestionGraphView from '../shared/graphs/QuestionGraphView';

class PromotedCarousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      concepts: [],
      promotedQuestions: [],
      carouselIndex: 0,
      carouselDir: null,
      questionGraphs: [],
    };

    this.handleCarousel = this.handleCarousel.bind(this);
  }

  componentDidMount() {
    this.props.appConfig.concepts((data) => {
      this.setState({ concepts: data });
    });
    this.props.appConfig.promotedQuestions(
      (data) => {
        const promotedQuestions = data.data.questions;
        this.setState({ promotedQuestions, questionGraphs: new Array(promotedQuestions.lenth) }, () => {
          if (promotedQuestions.length) {
            this.getQuestionGraph(this.state.carouselIndex);
          }
        });
      },
      (err) => {
        console.log('Unable to get promoted questions:', err); // eslint-disable-line no-console
      },
    );
  }

  getQuestionGraph(index) {
    const { promotedQuestions, questionGraphs } = this.state;
    if (questionGraphs[index]) {
      // if we already have that question graph, don't do anything
      return;
    }
    const activeQuestionId = promotedQuestions[index].id;
    this.props.appConfig.questionData(
      activeQuestionId,
      (data) => {
        const { question } = data.data;
        const machineQuestion = JSON.parse(question.machine_question.body);
        const updatedQuestionGraphs = [...questionGraphs];
        updatedQuestionGraphs[index] = machineQuestion;
        this.setState({ questionGraphs: updatedQuestionGraphs });
      },
      (err) => {
        console.log('Unable to retrieve promoted question:', err); // eslint-disable-line no-console
      },
    );
  }

  handleCarousel(selectedIndex, e) {
    this.getQuestionGraph(selectedIndex);
    this.setState({ carouselIndex: selectedIndex, carouselDir: e.direction });
  }

  render() {
    const {
      carouselIndex, carouselDir, promotedQuestions,
      concepts, questionGraphs,
    } = this.state;
    const { appConfig } = this.props;
    return (
      <Jumbotron>
        <h2>Check out these questions!</h2>
        <Carousel
          activeIndex={carouselIndex}
          direction={carouselDir}
          onSelect={this.handleCarousel}
        >
          {promotedQuestions.map((question, i) => (
            <Carousel.Item key={`carousel-item-${i}`}>
              <div className="promotedQuestionBackground" />
              <Carousel.Caption>
                <p className="promotedQuestionText">{question.naturalQuestion}</p>
                {questionGraphs[i] && (
                  <QuestionGraphView
                    height={250}
                    concepts={concepts}
                    question={questionGraphs[i]}
                    interactable={false}
                    graphClickCallback={() => {}}
                  />
                )}
                <Button
                  onClick={() => appConfig.open(appConfig.urls.question(question.id))}
                  className="promotedQuestionButton"
                  bsSize="large"
                >
                  Open Question
                </Button>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </Jumbotron>
    );
  }
}

export default PromotedCarousel;
