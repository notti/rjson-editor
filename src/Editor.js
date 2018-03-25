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

    this.title = props.schema.title || this.props.id;
    this.state = { chevron: null };
  }

  setChevron = (chevron) => {
    this.setState({ chevron: chevron });
  }

  render() {
    const Editor = toEditor(this.props.schema) //FIXME: use current editor for multichoice
    if(Editor === undefined)
      return (
      <div className="form-group">
        <label>{this.props.schema.type}</label>
      </div>);

    //FIXME: raw html in titles?
    return (
      <div className="form-group">
        <label>{this.state.chevron}<span dangerouslySetInnerHTML={{__html: this.title}} /></label>
        <Editor
          defaults={this.props.defaults}
          id={this.props.id}
          schema={this.props.schema}
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
    this.value = newValue
  }

  render() {
    const schema = this.props.schema;
    return (
      <BaseEditor
        defaults={this.defaults}
        schema={schema}
        value={this.props.value} valueChange={this.valueChange}
      />
    );
  }
}

export default JSONEditor;
export { BaseEditor };