import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Editor.css';
import ObjectEditor from './editors/Object.js';
import StringEditor from './editors/String.js';

const editorTypes = {
  "object": ObjectEditor,
  "string": StringEditor
}

function toEditor(schema) {
  return editorTypes[schema.type];
}

class BaseEditor extends Component {
  constructor(props) {
    super(props);

    this.title = props.json.title || this.props.id;
    this.state = { chevron: null };
  }

  setChevron = (chevron) => {
    this.setState({ chevron: chevron });
  }

  render() {
    const Editor = toEditor(this.props.json) //FIXME: use current editor for multichoice
    return (
      <div className="form-group">
        <label>{this.state.chevron}{this.title}</label>
        <Editor
          defaults={this.props.defaults}
          id={this.props.id}
          json={this.props.json}
          value={this.props.value} valueChange={this.props.valueChange}
          setChevron={this.setChevron}
        />
      </div>
    );
  }
}

class JSONEditor extends Component {
  constructor(props) {
    super(props);
    this.value = props.value;

    this.defaults = {
      collapsed: false
    }
  }

  valueChange = (key, newValue) => {
    console.log(this.value)
    //this.value = newValue
  }

  render() {
    const json = this.props.json;
    return (
      <BaseEditor
        defaults={this.defaults}
        json={json}
        value={this.props.value} valueChange={this.valueChange}
      />
    );
  }
}

export default JSONEditor;
export { BaseEditor };