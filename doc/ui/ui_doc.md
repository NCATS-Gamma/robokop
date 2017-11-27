# PROTOCOP - User Interface Guide

PROTOCOP has a proof of concept user interface to facilitate creation of new blackboards, exploring blackboards and to showcase the importance of exploration to answered queries. The user interface is web pased and is available at tyrosine.ncats.io:5000. 

## Getting Started
When you first launch the user interface, we will be greated with a simple launch screen. Simply click through to get started.

![PROTOCOP Welcome Screen](../ui/images/doc1.png?raw=true)
 
## Blackboards Browser
In PROTOCOP, a collection of blackboards are stored in a common database. A blackboard is a knowledge graph corresponding to a particular user query. PROTOCOP currently has a database with many of the challenge questions detailed in the NCATS Reasoner challenge. From this initial user interface, we can 

![PROTOCOP Blackboard Browser](../ui/images/doc2.png?raw=true)

## Building a New Blackboard
New blackbaords are created using a custom user interface to define a sequence of steps between specified node types. Nodes can be specified by a specific search term, as a specific type or as an unspecified number steps. Once the build process is started, the knowledge graph is constructed in the background and the user is notified when it is finished.

![PROTOCOP Start a Blackboard](../ui/images/doc3.png?raw=true)

## Exploring a Blackboard
Completed blackboards can be explored by clicking on the entry in the blackboards list. The initial interface shows general information about the knowledge graph, the original query, and the knowledge sources that were used to construct the knowledge graph.

![PROTOCOP Explore a Blackboard 1](../ui/images/doc4.png?raw=true)

Using the tabbed interface on the right, a visualization of the knowledge graph can be found.

![PROTOCOP Explore a Blackboard 2](../ui/images/doc5.png?raw=true)

## Getting Answers
In PROTOCOP, answers to the user query are extracted and ranked from the knowledge graph in real-time. To start the answer generation process, click the button. For larger knowledge graphs this process can take a while (see current limitations below), but this process typically takes less than 1 minute.

![PROTOCOP Getting Answers](../ui/images/doc6.png?raw=true)

## Exploring Answers
PROTOCOP ranks answers extracted from the knowledge graph using several factors calculated from the supporting information. A list of the top 50 answers are shown as a list. Each answer can be visualized and explored using the graphical interface. The meta-data found for each edge can be explored and PubMed articles can be opened.

![PROTOCOP Getting Answers](../ui/images/doc7.png?raw=true)

## Current Limitations
PROTOCOP extracts answers from the knowledge graph in real-time. For large knowledge graphs this process may be very slow. For larger knolwedge graphs, a warning message will be displayed when it is anticipated that answer extraction will take longer than usual.

![PROTOCOP Getting Answers](../ui/images/doc8.png?raw=true)
