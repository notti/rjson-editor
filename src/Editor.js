import React, { Component } from 'react';
import './Editor.css';
import processSchema from './Schema.js';
import State from './State.js';
import Defaults from './Defaults.js';

import { XCircle, CheckCircle } from 'react-feather';

class BaseEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editor: props.constraints.getEditor(),
      editorId: 0,
      value: undefined,
      precontrol: {},
      postcontrol: {}
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.value === prevState.value) {
      return null;
    }
    return {
        editorId: prevState.editor.idForValue(nextProps.value),
        value: nextProps.value
    };
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
    this.setState({ editorId: e.target.value });
  }

  valueChange = (key, newValue) => {
    this.props.valueChange(key, newValue);
    this.setState({ value: newValue });
  }

  render() {
    const precontrol = Object.values(this.state.precontrol).sort((a, b) => (a.order - b.order)).map(val => (val.control));
    const postcontrol = Object.values(this.state.postcontrol).sort((a, b) => (a.order - b.order)).map(val => (val.control));
    let Editor = this.state.editor.component();
    let constraints = this.state.editor.constraints;
    let editors = "";
    if (Editor === undefined)
      return (
        <div className="form-group">
          <label>{this.state.editor.type}</label>
        </div>);

    if (Array.isArray(Editor)) {
      editors = (
        <select value={this.state.editorId} className="custom-select custom-select-sm ml-2 editor-chooser" onChange={this.handleEditorChange}>
          {Editor.map((editor, i) => (<option key={i} value={i}>{editor.title}</option>))}
        </select>
      );
      constraints = Editor[this.state.editorId].constraints;
      Editor = Editor[this.state.editorId].component();
    }

    const editor = (<Editor
      state={this.props.state}
      key={this.state.editorId}
      defaults={this.props.defaults.apply(constraints)}
      id={this.props.id}
      constraints={constraints}
      value={this.state.value} valueChange={this.valueChange}
      addPrecontrol={this.addPrecontrol} delPrecontrol={this.delPrecontrol}
      addPostcontrol={this.addPostcontrol} delPostcontrol={this.delPostcontrol}
      editModal={this.props.editModal}
      events={this.props.events}
    />);

    if (this.props.short === true)
      return (
        <div className="form-group mb-2 mr-2 short">{precontrol}{editors}<div className="editor">{editor}</div>{postcontrol}</div>
      );
    const title = this.props.constraints.title || this.props.id;
    //FIXME: raw html in titles?
    return (
      <div className="form-group mr-2">
        <div className="form-inline mb-2">{precontrol}<span dangerouslySetInnerHTML={{ __html: title }} />{editors}{postcontrol}</div>
        {editor}
      </div>
    );
  }
}

class RawEditor extends Component {
  constructor(props) {
    super(props);

    this.backdrop = document.createElement("div");
    this.backdrop.classList.add("modal-backdrop", "show");
    this.dialog = React.createRef();
    this.session = null;
    this.editor = null;
    this.obj = null;
  }

  close = () => {
    this.obj = null;
    const dialog = this.dialog.current;
    document.body.removeChild(this.backdrop);
    dialog.classList.remove("show");
    dialog.style.display = 'none';
    document.body.classList.remove("modal-open");
  }

  ok = () => {
    try {
      this.obj.setValue(JSON.parse(this.session.getValue()));
      this.close();
    } catch (e) {
      window.alert("Invalid JSON! " + e);
    }
  }

  open = (obj) => {
    this.obj = obj;
    this.session.setValue(JSON.stringify(obj.getValue(), null, 2));
    const dialog = this.dialog.current;
    dialog.classList.add("show");
    dialog.style.display = 'block';
    document.body.appendChild(this.backdrop);
    document.body.classList.add("modal-open");
  }

  componentDidMount() {
    var ace = require('brace');
    require('brace/mode/json');
    require('brace/theme/github');

    this.editor = ace.edit('ace');
    this.editor.$blockScrolling = Infinity;
    this.session = this.editor.getSession();
    this.session.setMode('ace/mode/json');
    this.editor.setTheme('ace/theme/github');
  }

  render() {
    return (
      <div className="modal" tabIndex="-1" role="dialog" ref={this.dialog}>
        <div className="modal-dialog raw-dialog" role="document">
          <div className="modal-content raw-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit raw JSON</h5>
              <button type="button" className="close" onClick={this.close}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body" id="ace"></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={this.ok}><CheckCircle /> Modify</button>
              <button type="button" className="btn btn-secondary" onClick={this.close}><XCircle /> Cancel</button>
            </div>
          </div>
        </div>
      </div>)
  }
}

class JSONEditor extends Component {
  constructor(props) {
    super(props);

    this.schema = props.schema;
    this.pseudoschema = processSchema(this.schema);
    this.editModal = React.createRef();
    this.state = {
      value: undefined,
      state: new State()
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.value === prevState.value) {
      return null;
    }
    return {
      value: nextProps.value,
      state: new State()
    };
  }

  valueChange = (key, newValue) => {
    this.setState({ value: newValue })
  }

  getValue = () => {
    return this.state.value;
  }

  onEdit = () => {
  }

  render() {
    return (
      <React.Fragment>
        <BaseEditor
          state={this.state.state}
          defaults={new Defaults(this.props.defaults, this.state.state)}
          constraints={this.pseudoschema}
          value={this.state.value} valueChange={this.valueChange}
          editModal={this.editModal}
          events={{
            onEdit: this.props.onEdit || this.onEdit,
            onConstruct: this.props.onConstruct,
            onDestruct: this.props.onDestruct
          }}
        />
        <RawEditor ref={this.editModal} />
      </React.Fragment>
    );
  }
}

export default JSONEditor;
export { BaseEditor };
