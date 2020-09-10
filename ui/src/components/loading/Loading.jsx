import React from 'react';

import './loading.css';

const Loading = (props) => {
  const showMessage = Boolean(props && ('message' in props));
  const { message } = props;

  return (
    <div className="loader">
      <div className="bubble" />
      <div className="bubble" />
      <div className="bubble" />
      <div className="bubble" />
      {showMessage && message}
    </div>
  );
};

export default Loading;
