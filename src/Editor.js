import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Editor.css';
import processSchema from './Schema.js';

class BaseEditor extends Component {
  constructor(props) {
    super(props);

    this.title = props.schema.title || this.props.id;
    this.state = { chevron: null };
    this.editor = props.schema.getEditor();
  }

  setChevron = (chevron) => {
    this.setState({ chevron: chevron });
  }

  render() {
    const Editor = this.editor.component();
    if(Editor === undefined)
      return (
      <div className="form-group">
        <label>{this.editor.type}</label>
      </div>);

    //FIXME: raw html in titles?
    return (
      <div className="form-group">
        <label>{this.state.chevron}<span dangerouslySetInnerHTML={{__html: this.title}} /></label>
        <Editor
          defaults={this.props.defaults}
          id={this.props.id}
          constraints={this.editor.constraints}
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
    this.schema = props.schema;
    this.pseudoschema = processSchema(this.schema);
  }

  valueChange = (key, newValue) => {
    this.value = newValue
  }

  render() {
    return (
      <BaseEditor
        defaults={this.defaults}
        schema={this.pseudoschema}
        value={this.props.value} valueChange={this.valueChange}
      />
    );
  }
}

export default JSONEditor;
export { BaseEditor };