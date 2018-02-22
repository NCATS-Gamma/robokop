import React from 'react';
import { BarLoader } from 'react-css-loaders';

const Loading = ({ in: inProp }) => (
  <div className="center-block">
    <BarLoader />
  </div>
);
  
export default Loading