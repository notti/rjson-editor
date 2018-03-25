import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import JSONEditor from './Editor';
import registerServiceWorker from './registerServiceWorker';
import schema from './schema_v2.json';

const value = undefined;

ReactDOM.render(<JSONEditor schema={schema} value={value} />, document.getElementById('root'));
registerServiceWorker();
