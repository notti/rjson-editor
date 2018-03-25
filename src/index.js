import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import JSONEditor from './Editor';
import registerServiceWorker from './registerServiceWorker';

const test = {
    "title": "Person",
    "type": "object",
    "properties": {
        "firstName": {
            "type": "string"
        },
        "lastName": {
            "type": "string"
        }/*,
        "age": {
            "description": "Age in years",
            "type": "integer",
            "minimum": 0
        }*/
    },
    "required": ["firstName", "lastName"]
  };

const value = {'firstName': 'A', 'lastName': 'B'};

ReactDOM.render(<JSONEditor json={test} value={value} />, document.getElementById('root'));
registerServiceWorker();
