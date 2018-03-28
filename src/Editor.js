import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Editor.css';
import processSchema from './Schema.js';

class BaseEditor extends Component {
  constructor(props) {
    super(props);

    this.title = props.constraints.title || this.props.id;
    this.editor = props.constraints.getEditor();
    this.state = { chevron: null, editor: 0 }; //FIXME: match default editor with value
  }

  setChevron = (chevron) => {
    this.setState({ chevron: chevron });
  }

  handleEditorChange = (e) => {
    this.setState({editor: e.target.value});
  }

  render() {
    let Editor = this.editor.component();
    let constraints = this.editor.constraints;
    let editors = "";
    if(Editor === undefined)
      return (
      <div className="form-group">
        <label>{this.editor.type}</label>
      </div>);

    if(Array.isArray(Editor)) {
      editors = (
        <select value={this.state.editor} className="custom-select custom-select-sm mx-2 editor-chooser" onChange={this.handleEditorChange}>
          {Editor.map((editor, i) => (<option key={i} value={i}>{editor.title}</option>))}
        </select>
      );
      constraints = Editor[this.state.editor].constraints;
      Editor = Editor[this.state.editor].component();
    }

    //FIXME: raw html in titles?
    return (
      <div className="form-group">
        <label className="form-inline">{this.state.chevron}<span dangerouslySetInnerHTML={{__html: this.title}} />{editors}</label>
        <Editor
          defaults={this.props.defaults}
          id={this.props.id}
          constraints={constraints}
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
        constraints={this.pseudoschema}
        value={this.props.value} valueChange={this.valueChange}
      />
    );
  }
}

export default JSONEditor;
export { BaseEditor };