import React, { Component } from 'react';
import chevronRight from 'open-iconic/svg/chevron-right.svg'
import chevronBottom from 'open-iconic/svg/chevron-bottom.svg'

import { BaseEditor } from '../Editor.js';

class PropertyEditor extends Component {
  constructor(props) {
    super(props)

    this.state = { value: props.item.active };
  }

  handleChange = (e) => {
    this.setState(prevState => {
      if (!prevState.value)
        this.props.addProperty(this.props.item.id);
      else
        this.props.delProperty(this.props.item.id);
      return { value: !prevState.value }
    });
  }

  render() {
    const item = this.props.item;
    const title = item.title || item.id;
    return (
      <div className="custom-control custom-checkbox">
        <input type="checkbox" className="custom-control-input" checked={this.state.value} disabled={item.required} onChange={this.handleChange} />
        <label className="custom-control-label" onClick={this.handleChange} dangerouslySetInnerHTML={{ __html: title }} ></label>
      </div>
    );
  }
}

class PropertyDialog extends Component {
  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  setWrapperRef = (node) => {
    this.wrapperRef = node;
  }

  handleClickOutside = (e) => {
    if (this.wrapperRef && !this.wrapperRef.contains(e.target) && !this.props.button.contains(e.target)) {
      this.props.close();
    }
  }

  render() {
    const properties = this.props.properties.map(item => (<PropertyEditor key={item.id} item={item} addProperty={this.props.addProperty} delProperty={this.props.delProperty} />));
    return (
      <div className="modal-dialog" ref={this.setWrapperRef}>
        <div className="modal-content">
          <div className="modal-body">
            {properties}
          </div>
          <div className="modal-footer">
            More Stuff
          </div>
        </div>
      </div>
    );
  }
}

class PropertyButton extends Component {
  constructor(props) {
    super(props);

    this.state = { open: false };
  }

  handleOpen = (e) => {
    this.setState((prevState) => ({ open: !prevState.open }));
  }

  close = () => {
    this.setState({ open: false });
  }

  setWrapperRef = (node) => {
    this.wrapperRef = node;
  }

  render() {
    let classes = "btn btn-sm btn-outline-secondary dropdown-toggle";
    if (this.state.open) {
      classes += " active"
    }
    return (
      <div className="mx-2 propertyContainer">
        <button type="button" className={classes} onClick={this.handleOpen} ref={this.setWrapperRef}>Properties</button>
        {this.state.open && <PropertyDialog close={this.close} button={this.wrapperRef} properties={this.props.getProperties()} addProperty={this.props.addProperty} delProperty={this.props.delProperty} />}
      </div>
    );
  }
}

class Chevron extends Component {
  constructor(props) {
    super(props);

    this.state = { open: props.open };
  }

  handleHide = (e) => {
    e.preventDefault();
    this.setState((prevState) => {
      let open = !prevState.open;
      this.props.handleHide(open);
      return { open: open }
    })
  }

  render() {
    const button = this.state.open ? (
      <img src={chevronBottom} alt="close" className="chevron" />
    ) : (
        <img src={chevronRight} alt="open" className="chevron" />
      );

    return (
      <a href="#collapse" className="mr-2" onClick={this.handleHide}>{button}</a>
    );
  }
}

class ObjectEditor extends Component {
  constructor(props) {
    super(props);

    this.state = { open: !props.defaults.collapsed };
    this.value = props.value;
    const required = props.constraints.required || [];
    this.hasOptional =
      props.constraints.patternProperties !== undefined ||
      (props.constraints.additionalProperties !== undefined && props.constraints.additionalProperties !== false) ||
      Object.keys(props.constraints.properties || {}).filter(item => (required.indexOf(item) < 0)).length !== 0;
    if (this.value === undefined) {
      if (props.constraints.default !== undefined) {
        this.value = JSON.parse(JSON.stringify(props.constraints.default));
      } else {
        this.value = {}
        if (props.constraints.required !== undefined) {
          for (let property of props.constraints.required) {
            this.value[property] = undefined;
          }
        }
      }
      props.valueChange(props.id, this.value);
    }
  }

  getProperties = () => {
    const active = Object.keys(this.value);
    const required = this.props.constraints.required || [];
    const properties = this.props.constraints.properties || {};

    return [...new Set(Object.keys(properties).concat(active))].map(val => (
      { id: val, active: active.indexOf(val) >= 0, required: required.indexOf(val) >= 0, title: (properties[val] || {}).title }
    ));
  }

  addProperty = (id) => {
    this.value[id] = undefined;
    this.forceUpdate();
  }

  delProperty = (id) => {
    delete this.value[id];
    this.forceUpdate();
  }

  componentDidMount() {
    this.props.addPrecontrol("chevron", -1000, <Chevron key="objectChevron" handleHide={this.handleHide} open={this.state.open} />);
    if (this.hasOptional)
      this.props.addPostcontrol("properties", -1000, <PropertyButton key="objectProperty" getProperties={this.getProperties} addProperty={this.addProperty} delProperty={this.delProperty} />);
  }

  componentWillUnmount() {
    this.props.delPrecontrol("chevron");
    this.props.delPostcontrol("properties");
  }

  handleHide = (open) => {
    this.setState({ open: open });
  }

  valueChange = (key, newValue) => {
    this.value[key] = newValue;
  }

  render() {
    if (!this.state.open) {
      return "";
    }
    const properties = this.props.constraints.properties;

    const subEditors = Object.keys(this.value)
      .sort((a, b) => {
        let i = properties[a].propertyOrder;
        let j = properties[b].propertyOrder;
        if (i === undefined)
          i = 1000;
        if (j === undefined)
          j = 1000;
        return i - j;
      }).map((key) => {
        return (
          <BaseEditor
            defaults={this.props.defaults}
            key={key} id={key}
            constraints={properties[key]} //FIXME: handle additionalProperties and patternProperties
            value={this.value[key]} valueChange={this.valueChange}
          />);
      })

    return (
      <div className="objectBody mx-2 px-2 border border-top-0 rounded-bottom">
        {subEditors}
      </div>
    );
  }
}

export default ObjectEditor;