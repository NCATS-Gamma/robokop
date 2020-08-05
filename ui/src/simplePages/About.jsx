import React, { useState, useEffect } from 'react';

import {
  Grid, Row, Col, Panel,
} from 'react-bootstrap';

export default function About() {
  const [licenses, updateLicenses] = useState([]);

  useEffect(() => {
    // this.appConfig.licenses(
    //   licenses => this.setState({ licenses }),
    //   err => console.log('Failed to retrieve license information. This may indicate a connection issue.', err),
    // );
  }, []);

  return (
    <Grid style={{ marginBottom: '50px' }}>
      <Row>
        <Col md={8}>
          <h2>About Robokop</h2>
          <hr />
          <h3>Overview</h3>
          <p>Knowledge graphs (KGs) are becoming more and more popular to store data from which higher-level analysis can be implemented. KGs typically get stored as graph-databases, and queries on those databases can be used to answer questions of interest posed by users, in our case,  biomedical researchers. For queries containing just a few data points, the number of connections in the knowledge graph and the storage and analysis of the results are simple. However, for more complex queries, the analysis of the results gets exponentially harder. For instance, a relatively complex query can return a knowledge graph with hundreds of thousands of results. We created ROBOKOP (Reasoning Over Biomedical Objects linked in Knowledge Oriented Pathways) as a way for users to more easily query knowledge graphs and store, rank, and explore query results.</p>
          <hr />
          <h3>Questions and Answers</h3>
          <p>Queries (read as Questions) are JSON templates that have been abstracted into a more friendly user interface (UI). Each node in the question subgraph signifies an entity with a type and specified properties, and edges with predicate types can be specified to limit the allowable relationships between nodes. If multiple predicates are given, then edges that match any predicates will be included, and if no predicates are given, then edges are not limited. Results of the query (read as Answers) are subgraphs that match the types and desired properties of the nodes and edges. Answers are stored using bindings of the nodes and edges in the question as references in the local knowledge graph. This format is efficient in that nodes and edges that are used in multiple answers do not require duplication. Additionally, the nodes and edges within each answer are bound to the nodes and edges of the question. This makes the analysis of complex questions containing repeated node types, or even repeats of the same node, transparent.</p>
          <hr />
          <h3>Answer Ranking</h3>
          <p>Questions that are asked with very few node and edge properties or with many nodes and edges typically result in a lot of answers. As such, the ranking of answer subgraphs by relevance is critical for user analysis. The ROBOKOP answer-ranking algorithm weights each edge within each subgraph based on the number of PubMed article abstracts that cite both the source and target nodes. The publication support is provided by an additional ROBOKOP service, OmniCorp, that contains a graph of PubMed identifiers linked to node types referenced within abstracts. A weighted score for each answer is calculated based on the distance from one node to another given the nodes and edges between them and from the publication counts provided by curated data sources and Omnicorp.</p>
          <hr />
          <h3>APIs, Knowledge Sources, and Automated Workflows and Modules</h3>
          <p>
            {'An extensive list of Robokop resources can be found at '}
            <a target="_blank" rel="noopener noreferrer" href="https://researchsoftwareinstitute.github.io/data-translator/apis">RSI Data Translator</a>
            {' or users can view all publicly available APIs by going to the '}
            <a href="/apidocs/">APIDocs</a>
            {' page.'}
          </p>
          <hr />
          <h3>Open Source</h3>
          <p>
            {'This project is open source. All the code can be found on GitHub: '}
            <a href="https://github.com/NCATS-Gamma">Robokop</a>
          </p>
          <Panel style={{ marginTop: 30 }}>
            <Panel.Heading style={{ padding: 0 }}>
              <Panel.Title toggle>
                <h3 style={{ margin: 0, padding: 20 }}>Source Licenses</h3>
              </Panel.Title>
            </Panel.Heading>
            <Panel.Collapse>
              <Panel.Body>
                {licenses.map((license) => (
                  <div key={license.name}>
                    <hr />
                    <h3>{license.name}</h3>
                    <p>
                      {'Home: '}
                      <a href={license.url}>{license.url}</a>
                    </p>
                    <p>
                      {'Type: '}
                      {license.license}
                    </p>
                    <p>
                      {'License: '}
                      <a href={license.license_url}>{license.license_url}</a>
                    </p>
                    <p>
                      {'Citation: '}
                      <a href={license.citation_url}>{license.citation_url}</a>
                    </p>
                  </div>
                ))}
                {licenses.length === 0 && (
                  <p>Loading licenses...</p>
                )}
              </Panel.Body>
            </Panel.Collapse>
          </Panel>
        </Col>
      </Row>
    </Grid>
  );
}
