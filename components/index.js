// 'use babel'

import React from 'react';
import ReactDOM from 'react-dom';
import Application from './Application';

const $ = require('jquery');
window.jQuery = window.$ = $; // eslint-disable-line
require('bootstrap');
const config = require('../config.json');

ReactDOM.render(<Application host={config.host} port={config.port} />, document.getElementById('reactEntry'));
