import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

import FaDownload from 'react-icons/lib/fa/download';
import FaUpload from 'react-icons/lib/fa/upload';
import FaTrash from 'react-icons/lib/fa/trash';
import FaUndo from 'react-icons/lib/fa/rotate-left';
import FaPaperPlaneO from 'react-icons/lib/fa/paper-plane-o';
import FaFloppyO from 'react-icons/lib/fa/floppy-o';
import FaPlusSquare from 'react-icons/lib/fa/plus-square';
import FaPlus from 'react-icons/lib/fa/plus';
import FaWrench from 'react-icons/lib/fa/wrench';
import FaFolder from 'react-icons/lib/fa/folder';

import AppConfig from '../AppConfig';
import Loading from '../components/Loading';
import Header from '../components/Header';
import Footer from '../components/Footer';

class Help extends React.Component {
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
        this.setState(
          {
            user: data,
            ready: true,
          },
          () => {
            // we need to wait for user obj to be ready before moving to anchor tag
            const { hash } = window.location;
            if (hash) {
              const a = document.createElement('a');
              a.href = hash; // ex: <a href='#questionNew'></a>
              document.body.appendChild(a);
              a.click();
              a.remove();
            }
          },
        ),
      (err) => {
        console.log('Failed to retrieve user information. This may indicate a connection issue.');
        console.log(err);
      },
    );
  }

  render() {
    const { user, ready } = this.state;
    return (
      <div>
        {ready ? (
          <div>
            <Header config={this.props.config} user={user} />
            <Grid>
              <Row>
                <Col md={8}>
                  <h2>APIs</h2>
                  <h3 id="expandAPI">Expand API</h3>
                  <p>
                    Direction is the direction of an edge between two nodes. The
                    default is out, meaning an edge from node 1 to node 2. This
                    parameter only matters if predicate is also set.
                  </p>
                  <p>
                    Max connectivity is the maximum number of edges into or out
                    of nodes within the answer (0 for inifinite).
                  </p>
                  <h2>Answers Knowledge Graph</h2>
                  <h3 id="knowledgeGraph">Knowledge Graph</h3>
                  <p>
                    All of Robokop&apos;s knowledge is stored in a large
                    knowledge graph. You can explore the local region of the
                    knowledge graph that we think is relevant to this question.
                  </p>
                  <br />
                  <p>
                    This whole subgraph might be quite large, so we prune it
                    down to show you the top 35 most relevant nodes first. If
                    you would like to see more or fewer nodes, click on the
                    Pruned Graph text in the top right of the graph to edit the
                    number of nodes to show.
                  </p>
                  <h2 id="questionNew">New Question</h2>
                  <hr style={{ height: '3px' }} />
                  <h3>New Question Buttons</h3>
                  <p>
                    The Upload [<FaUpload size={14} />
                    ], Download [<FaDownload size={14} />] and Reset [
                    <FaTrash size={14} />] buttons at the top of the page can be
                    clicked to import, export (as a JSON file) or reset the
                    current question. The Submit [<FaPaperPlaneO size={14} />]
                    button submits the current question to ROBOKOP. The user can
                    also pre-populate the question graph from a list of
                    pre-existing question templates by clicking the Use a
                    Question Template [<FaFolder size={14} />] button.
                  </p>
                  <hr />
                  <h3>Question Text Field</h3>
                  <p>
                    Text description of the question being constructed. This can
                    usually serve as a good starting point for further
                    customizations of the machine-question via this UI. This
                    text has no effect on the outputted answers.
                  </p>
                  <hr />
                  <h3 id="machineQuestionEditor">Machine Question Editor</h3>
                  <p>
                    This graph provides an updated view of the Machine question
                    as it is constructed by the user. Each node and edge in the
                    graph can be clicked on to display and edit the relevant
                    node/edge details in the popup window. The active Node or
                    Edge is indicated by a thicker edge width. Any node that
                    represents a set is indicated by a thicker border.
                  </p>
                  <p>
                    Note: Deleted nodes are still shown in grey with a dashed
                    border until any edges that link to the deleted node are set
                    to point to valid nodes, or themselves deleted.
                  </p>
                  <hr />
                  <h3 id="questionGraphOptions">Question Graph Options</h3>
                  <p>
                    The user can create a new Node [<FaPlusSquare size={14} />
                    ], new Edge [<FaPlus size={14} />
                    ], or Edit [<FaWrench size={14} />] the graph specification
                    in a JSON editor by clicking the buttons in the top left
                    corner of the question graph section.
                  </p>
                  <hr />
                  <h3 id="nedgePanel">Node / Edge Panel</h3>
                  <p>
                    The toolbar at the top of the Node / Edge panel enables the
                    user to Save [<FaFloppyO size={14} />] or Undo [
                    <FaUndo size={14} />
                    ] any changes, or Delete [<FaTrash size={14} />] the current
                    Node / Edge.
                  </p>
                  <p>
                    Each Node <strong>must</strong> have a valid Node Type
                    specified. If the user wants to treat the node as a specific
                    entry, then the next input area must have a valid name
                    selected. Nodes with a name associated with them are
                    highlighted with an asterisk [*] at the end of the node
                    name.
                  </p>
                  <p>
                    The Specific Entry selector can be used to specify a name
                    for the specified Node type. Typing text in the search field
                    will attempt to find matches via Bionames. Users can always
                    specify a custom name by directly typing it into the field -
                    eg: &quot;MONDO:123456&quot;. A name must always be selected
                    by clicking the &quot;Select&quot; button for the name in
                    the search popup box.
                  </p>
                  <p>
                    Each Edge <strong>must</strong> have a valid Source and
                    Target node. If an existing node is deleted, it is still
                    displayed in the graph so the invalid edges referencing the
                    deleted node can be edited and modified to either point to a
                    different node, or be deleted.
                  </p>
                  <p>
                    An edge can optionally have a predicate (if supported by
                    Robokop). Predicates can be chosen from the dropdown list.
                  </p>
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

export default Help;
