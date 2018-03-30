import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Editor.css';
import processSchema from './Schema.js';

class BaseEditor extends Component {
  constructor(props) {
    super(props);

    this.title = props.constraints.title || this.props.id;
    this.editor = props.constraints.getEditor();
    this.value = props.value;
    this.state = { editor: 0, precontrol: {}, postcontrol: {} }; //FIXME: match default editor with value
  }

  addPrecontrol = (id, order, control) => {
    this.setState((prevState) => {
      let precontrol = { ...prevState.precontrol };
      precontrol[id] = { order: order, control: control };
      return { precontrol: precontrol };
    });
  }

  delPrecontrol = (id) => {
    this.setState((prevState) => {
      let precontrol = { ...prevState.precontrol };
      delete precontrol[id];
      return { precontrol: precontrol };
    });
  }

  addPostcontrol = (id, order, control) => {
    this.setState((prevState) => {
      let postcontrol = { ...prevState.postcontrol };
      postcontrol[id] = { order: order, control: control };
      return { postcontrol: postcontrol };
    });
  }

  delPostcontrol = (id) => {
    this.setState((prevState) => {
      let postcontrol = { ...prevState.postcontrol };
      delete postcontrol[id];
      return { postcontrol: postcontrol };
    });
  }

  handleEditorChange = (e) => {
    this.setState({ editor: e.target.value });
  }

  valueChange = (key, newValue) => {
    this.value = newValue
    this.props.valueChange(key, newValue);
  }

  render() {
    const precontrol = Object.values(this.state.precontrol).sort((a, b) => (a.order - b.order)).map(val => (val.control));
    const postcontrol = Object.values(this.state.postcontrol).sort((a, b) => (a.order - b.order)).map(val => (val.control));
    let Editor = this.editor.component();
    let constraints = this.editor.constraints;
    let editors = "";
    if (Editor === undefined)
      return (
        <div className="form-group">
          <label>{this.editor.type}</label>
        </div>);

    if (Array.isArray(Editor)) {
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
        <div className="form-inline mb-2">{precontrol}<span dangerouslySetInnerHTML={{ __html: this.title }} />{editors}{postcontrol}</div>
        <Editor
          key={this.state.editor}
          defaults={this.props.defaults}
          id={this.props.id}
          constraints={constraints}
          value={this.value} valueChange={this.valueChange}
          addPrecontrol={this.addPrecontrol} delPrecontrol={this.delPrecontrol}
          addPostcontrol={this.addPostcontrol} delPostcontrol={this.delPostcontrol}
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