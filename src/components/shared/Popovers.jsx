import React from 'react';
import { Popover } from 'react-bootstrap';

import FaDownload from 'react-icons/lib/fa/download';
import FaUpload from 'react-icons/lib/fa/upload';
import FaTrash from 'react-icons/lib/fa/trash';
import FaUndo from 'react-icons/lib/fa/rotate-left';
import FaPaperPlaneO from 'react-icons/lib/fa/paper-plane-o';
import FaFloppyO from 'react-icons/lib/fa/floppy-o';
import FaPlusSquare from 'react-icons/lib/fa/plus-square';
import FaPlus from 'react-icons/lib/fa/plus';
import FaWrench from 'react-icons/lib/fa/wrench';

const questionGraphPopover = (
  <Popover id="popover-positioned-right-2" title="Machine Question Editor Overview">
    <p>
      This graph provides an updated view of the Machine question as it is constructed by the user.
      Each node and edge in the graph can be clicked on to display and edit the relevant node/edge details in
      the panel below the graph. The active Node or Edge is indicated by a thicker edge width. Any node that
      represents a set is indicated by a thicker border.
    </p>
    <p>
      Note: Deleted nodes are still shown in grey with a dashed border until any edges that link to the deleted
      node are set to point to valid nodes, or themselves deleted.
    </p>
    <p><strong>Graph Panel Toolbar</strong><br />
      The [<FaUpload size={14} />], [<FaDownload size={14} />] and [<FaTrash size={14} />] buttons in the title bar
      of the Graph panel can be clicked to import, export (as a JSON file) or reset the current question.
      The [<FaPaperPlaneO size={14} />] button submits the current question to ROBOKOP. The user can also pre-populate
      the question graph from a list of pre-existing question templates that are available through the drop-down menu
      in the graph panel toolbar.
    </p>
    <p><strong>Edge / Node Panel Toolbar</strong><br />
      The toolbar above the Node / Edge panel enables the user to [Save <FaFloppyO size={14} />] or [Undo <FaUndo size={14} />]
      any changes, [Delete <FaTrash size={14} />] the current Node / Edge or create
      a new Node [<FaPlusSquare size={14} />] or Edge [<FaPlus size={14} />]. Additionally, the user can
      edit the JSON form of the graph specification in a JSON editor by clicking the [Edit JSON <FaWrench size={14} />] button.
    </p>
  </Popover>
);

const nodePanelPopover = (
  <Popover id="popover-positioned-right" title="Node Builder Help">
    <p>
      Each Node <strong>must</strong> have a valid Node Type specified. If Curies are enabled, then
      each curie input area must have a valid Curie selected. Nodes with one or more curies associated
      with them are highlighted with an asterisk [*] at the end of the node name.
    </p>
    <p>
      The Curie selector can be used to specify a curie for the specified Node type.
      Typing text in the search field will attempt to find matches via Bionames. User can always
      specify a custom Curie by directly typing it into the field - eg: &quot;MONDO:123456&quot;.
      A curie must always be selected by clicking the &quot;Select&quot; button for the curie in the search popup box.
    </p>
    <p>
      Providing a Node name is purely optional, but can make navigating the displayed graph easier as nodes in the graph
      UI are always labeled with the Node name if provided by the user.
    </p>
  </Popover>
);

const edgePanelPopover = (
  <Popover id="popover-positioned-right" title="Node Builder Help">
    <p>
      Each Edge <strong>must</strong> have a valid Source and Target node. If an existing node is deleted,
      it is still displayed in the graph so the invalid edges referencing the deleted node can be edited
      and modified to either point to a different node, or be deleted.
    </p>
    <p>
      An edge can optionally have a predicate (if supported by Robokop). Typing in the predicate name in the
      input field lets the user create a predicate tag for the node. <strong>Note:</strong> Currently, predicates
      are not validated by the UI. The user must ensure the validity of the predicates entered into the UI.
    </p>
    <p>
      Providing a Node name is purely optional, but can make navigating the displayed graph easier as nodes in the graph
      UI are always labeled with the Node name if provided by the user.
    </p>
  </Popover>
);

const questionNamePopover = (
  <Popover title="Question help" id="popover-positioned-right">
    Text description of the question being constructed. Hitting Enter or clicking the {'"Try NLP Engine"'} button
    submits the question to the Natural Language Processing (NLP) engine that attempts to parse the question and
    return a matching machine-question specification. This can usually serve as a good starting point for further
    customizations of the machine-question via this UI.
  </Popover>
);

export { questionGraphPopover, nodePanelPopover, edgePanelPopover, questionNamePopover };
