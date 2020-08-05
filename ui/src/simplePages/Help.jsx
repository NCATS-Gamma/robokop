import React, { useEffect } from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

import {
  FaDownload, FaTrash, FaUndo,
  FaRegPaperPlane, FaRegSave, FaPlusSquare, FaPlus,
} from 'react-icons/fa';

export default function Help() {
  useEffect(() => {
    const { hash } = window.location;
    if (hash) {
      const a = document.createElement('a');
      a.href = hash; // ex: <a href='#questionNew'></a>
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, []);

  return (
    <div>
      <Grid>
        <Row style={{ marginBottom: '20px' }}>
          <Col md={8}>
            <h2>Answers Knowledge Graph</h2>
            <hr style={{ border: '1px solid #eee' }} />
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
            <hr style={{ border: '1px solid #eee' }} />
            <h3>Getting started</h3>
            <p>
              There are four options when starting with a new question. You can
              start from scratch, upload a JSON object of a valid question, choose
              a pre-built question template, or fork an old question. If you choose
              any of the latter three options, you still have full control over your
              question customization.
            </p>
            <hr style={{ border: '1px solid #eee' }} />
            <h3>Question Title</h3>
            <p>
              Text description of the question being constructed. This can
              usually serve as a good starting point for further
              customizations of the machine-question via this UI. This
              text has no effect on the outputted answers.
            </p>
            <hr style={{ border: '1px solid #eee' }} />
            <h3 id="machineQuestionEditor">Machine Question Editor</h3>
            <p>
              This graph provides an updated view of the Machine question
              as it is constructed by the user. Each node and edge in the
              graph can be clicked on to display and edit the relevant
              node/edge details in the popup window. Any node that
              represents a set is indicated by a dark shadow, and a specific
              node is represented by a thicker border.
            </p>
            <p>
              Note: Deleted nodes are still shown in grey with a dashed
              border until any edges that link to the deleted node are set
              to point to valid nodes, or themselves deleted.
            </p>
            <hr style={{ border: '1px solid #eee' }} />
            <h3 id="questionGraphOptions">Question Graph Options</h3>
            <p>
              The user can create a new Node [
              <FaPlusSquare size={14} />
              ] or new Edge [
              <FaPlus size={14} />
              ] by clicking the buttons in the top left
              corner of the question graph section. If starting from scratch,
              these buttons will appear in the middle of the graph.
            </p>
            <p>
              An extra feature for more advanced customization can be found at the
              bottom left of the graph. This &quot;Advanced&quot; button will open a JSON editor
              where you can fully customize the question specification.
            </p>
            <hr style={{ border: '1px solid #eee' }} />
            <h3 id="nedgePanel">Node / Edge Panel</h3>
            <p>
              When adding a node, you can leave the text field empty to signify that this node
              can be anything. Otherwise, you can start typing what type of node you want and
              you will get a dropdown list of types (signified by a solid colored background)
              and named nodes (signified by small colored stripes denoting the types associated
              with that node, the name of the node, and other important details). A name must always
              be selected by clicking the &quot;Select&quot; button for the name on the far right. If
              you select a node type, depending on what type it is, you will have the option of applying
              constraints to that node. If you click on the button to add a constraint, a table will
              appear where you can choose a constraint from the dropdown list and then specify its
              value. Users can always specify a custom name by directly typing it into the field -
              eg: &quot;MONDO:123456&quot;.
            </p>
            <p>
              {'Each Edge '}
              <strong>must</strong>
              {' have a valid Source and '}
              Target node. If an existing node is deleted, it is still
              displayed in the graph so the invalid edges referencing the
              deleted node can be edited and modified to either point to a
              different node, or be deleted.
            </p>
            <p>
              An edge can optionally have predicates (if supported by
              Robokop). Predicates can be chosen from the dropdown list. Each
              predicate in this list is denoted by a number, which shows how
              many edges in the full knowledge graph have that predicate.
            </p>
            <p>
              The toolbar at the bottom of the Node / Edge panel enables the
              user to Save [
              <FaRegSave size={14} />
              ] or Undo [
              <FaUndo size={14} />
              ] any changes, or Delete [
              <FaTrash size={14} />
              ] the current Node / Edge.
            </p>
            <hr style={{ border: '1px solid #eee' }} />
            <h3>New Question Buttons</h3>
            <p>
              The Download [
              <FaDownload size={14} />
              ] and Reset [
              <FaTrash size={14} />
              ] buttons at the bottom of the page can be
              clicked to export (as a JSON file) or reset the
              current question. The Submit [
              <FaRegPaperPlane size={14} />
              ] button submits the current question to ROBOKOP.
            </p>
            <p>
              Note: Resetting the question will take you all the way back to
              your original four New Question options.
            </p>
            <h2>APIs</h2>
            <hr style={{ border: '1px solid #eee' }} />
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
          </Col>
        </Row>
      </Grid>
    </div>
  );
}
