import React from 'react';
import { BubbleLoader } from 'react-css-loaders';

const Loading = (props) => {
  const showMessage = Boolean(props && ('message' in props));
  const { message } = props;

  return (
    <div className="center-block">
      <BubbleLoader color="#b8c6db" />
      {showMessage && message}
    </div>
  );
};

export default Loading;
