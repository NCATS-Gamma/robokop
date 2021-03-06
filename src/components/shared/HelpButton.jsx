import React from 'react';
import GoQuestion from 'react-icons/lib/go/question';

const HelpButton = props => (
  <a href={`/help#${props.link}`} target="_blank" style={{ color: 'black' }}>
    <GoQuestion />
  </a>
);

export default HelpButton;
