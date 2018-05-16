import React, { Component } from 'react';
import { BaseEditor } from '../Editor.js';
import Chevron from './Chevron.js';
import { Edit2 } from 'react-feather';
import { EmptySchema } from '../Schema.js';

class PropertyEditor extends Component {
  constructor(props) {
    super(props)

    this.state = { value: props.item.active };
  }

  handleChange = (e) => {
    this.setState(prevState => {
      if (!prevState.value) {
        this.props.addProperty(this.props.item.id);
      } else {
        this.props.delProperty(this.props.item.id);
        if (this.props.item.custom)
          this.props.update();
      }
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
  constructor(props) {
    super(props);

    this.state = { new: "", invalid: undefined, properties: props.getProperties() };
  }

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

  handleChange = (e) => {
    const constraints = this.props.constraints;
    const value = e.target.value;
    let invalid = undefined;
    if ((new Set(this.state.properties.map((val) => (val.id)))).has(value))
      invalid = "Property already exists";
    if (invalid === undefined && constraints.propertyNames !== undefined)
      invalid = constraints.propertyNames.validate(value);
    if (invalid === undefined &&
      constraints.additionalProperties !== undefined && constraints.additionalProperties !== false &&
      constraints.patternProperties !== undefined) {
      let found = false;
      for (let pattern of Object.keys(constraints.patternProperties)) {
        if (RegExp(pattern).test(value)) {
          found = true;
          break;
        }
      }
      if (!found)
        invalid = "Must match one of " + Object.keys(constraints.patternProperties).join(", ");
    }
    this.setState({ new: e.target.value, invalid: invalid });
  }

  handleKeypress = (e) => {
    if (e.key === 'Enter')
      this.handleAdd();
  }

  handleAdd = () => {
    this.setState((prevState) => {
      if (prevState.new === "" || prevState.invalid !== undefined)
        return;
      this.props.addProperty(prevState.new);
      return { new: "", invalid: undefined, properties: this.props.getProperties() }
    });
  }

  update = () => {
    this.setState({ properties: this.props.getProperties() });
  }

  render() {
    const always = this.props.always;
    const propertyConstraints = (this.props.constraints.properties || {});
    const properties = this.state.properties.filter(prop => {
      if (always !== true)
        return true;
      if (propertyConstraints[prop.id] !== undefined)
        return false;
      return true;
    }).map(item => (
      <PropertyEditor
        key={item.id}
        item={item}
        addProperty={this.props.addProperty} delProperty={this.props.delProperty}
        update={this.update}
      />));
    const invalid = this.state.invalid;
    let textClass = "form-control";
    if (invalid !== undefined)
      textClass += " is-invalid";
    let buttonClass = "btn";
    if (invalid === undefined)
      buttonClass += " btn-outline-secondary";
    else
      buttonClass += " btn-outline-danger";
    return (
      <div className="modal-dialog" ref={this.setWrapperRef}>
        <div className="modal-content">
          <div className="modal-body">
            {properties}
          </div>
          {this.props.hasCustom &&
            <div className="modal-footer">
              <div className="input-group">
                <input type="text" className={textClass} placeholder="Property name" value={this.state.new} onChange={this.handleChange} onKeyPress={this.handleKeypress} />
                <div className="input-group-append">
                  <button className={buttonClass} type="button" onClick={this.handleAdd} >Add</button>
                </div>
              </div>
              {invalid !== undefined && <div className="invalid-feedback">{invalid}</div>}
            </div>
          }
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
      <div className="ml-2 propertyContainer">
        <button type="button" className={classes} onClick={this.handleOpen} ref={this.setWrapperRef}>Properties</button>
        {this.state.open && <PropertyDialog
          close={this.close}
          button={this.wrapperRef}
          getProperties={this.props.getProperties}
          addProperty={this.props.addProperty} delProperty={this.props.delProperty}
          hasCustom={this.props.hasCustom}
          constraints={this.props.constraints}
          always={this.props.always}
        />}
      </div>
    );
  }
}

class ObjectEditor extends Component {
  constructor(props) {
    super(props);

    const required = props.constraints.required || [];
    this.hasCustom = props.constraints.additionalProperties !== false;
    this.hasOptional = this.hasCustom ||
      Object.keys(props.constraints.properties || {}).filter(item => (required.indexOf(item) < 0)).length !== 0;

    let collapsed = props.state.collapsed;
    if (collapsed === undefined) {
      collapsed = props.state.collapsed = props.defaults.collapsed;
    }
    this.state = {
      open: !collapsed,
      value: {},
      invalid: props.constraints.validate({})
    };

    this.props.addPrecontrol("chevron", -1000, <Chevron key="objectChevron" handleHide={this.handleHide} open={this.state.open} />);
    if (this.hasOptional)
      this.props.addPostcontrol("properties", -1000, (
        <PropertyButton
          key="objectProperty"
          getProperties={this.getProperties}
          addProperty={this.addProperty} delProperty={this.delProperty}
          hasCustom={this.hasCustom}
          constraints={this.props.constraints}
          always={this.props.defaults.optionalPropertiesAlways}
        />));
    this.props.addPostcontrol("editJSON", -999, (
      <button type="button"
        key="editJSON"
        className="btn btn-sm btn-outline-secondary ml-2"
        onClick={this.openModal}><Edit2 /> JSON</button>
    ))
    if (typeof this.props.onConstruct === "function")
      this.props.onConstruct(this.props.state.path(), {
        getValue: this.getValue.bind(this),
        setValue: this.setValue.bind(this),
        addPrecontrol: this.props.addPrecontrol,
        addPostcontrol: this.props.addPostcontrol}, props.constraints);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.value === prevState.value) {
      return null;
    }
    const constraints = nextProps.constraints;
    let value = nextProps.value;
    if (value === undefined || !(value instanceof Object && value.constructor === Object)) {
      if (constraints.default !== undefined) {
        value = JSON.parse(JSON.stringify(constraints.default));
      } else {
        value = {};
        let properties = constraints.required || [];
        if (nextProps.defaults.optionalPropertiesTrue === true || nextProps.defaults.optionalPropertiesAlways === true) {
          properties = Object.keys(constraints.properties || {});
        }
        for (let property of properties) {
          value[property] = undefined;
        }
      }
      nextProps.valueChange(nextProps.id, value);
    } else if (constraints.required !== undefined) {
      let changed = false;
      let required = constraints.required;
      if (nextProps.defaults.optionalPropertiesAlways === true)
        required = Object.keys(constraints.properties || {});
      for (let property of required) {
        if (!value.hasOwnProperty(property)) {
          value[property] = undefined;
          changed = true;
        }
      }
      if (changed)
        nextProps.valueChange(nextProps.id, value);
    }
    return {
      value: value,
      valid: nextProps.constraints.validate(value)
    };
  }

  getProperties = () => {
    const active = Object.keys(this.state.value);
    const required = this.props.constraints.required || [];
    const properties = this.props.constraints.properties || {};

    return [...new Set(Object.keys(properties).concat(active))].map(val => (
      { id: val, active: active.indexOf(val) >= 0, required: required.indexOf(val) >= 0, title: (properties[val] || {}).title, custom: properties[val] === undefined }
    ));
  }

  addProperty = (id) => {
    this.props.onEdit(this.props.state.path(), id, "add")
    let tmp = this.state.value
    tmp[id] = undefined;
    this.setState({ invalid: this.props.constraints.validate(this.state.value) });
  }

  delProperty = (id) => {
    this.props.onEdit(this.props.state.path(), id, "del")
    let tmp = this.state.value
    delete tmp[id];
    this.setState({ invalid: this.props.constraints.validate(this.state.value) });
  }

  setValue = (val) => {
    if (JSON.stringify(val) === JSON.stringify(this.state.value))
      return;
    if (!(val instanceof Object && val.constructor === Object))
      return false;
    if (this.props.defaults.optionalPropertiesAlways === true) {
      let required = Object.keys(this.props.constraints.properties || {});
      for (let property of required) {
        if (!val.hasOwnProperty(property)) {
          val[property] = undefined;
        }
      }
    }
    this.props.onEdit(this.props.state.path(), val, "set")
    this.setState({
      value: val,
      invalid: this.props.constraints.validate(val)
    });
    this.props.valueChange(this.props.id, val);
  }

  getValue = () => {
    return this.state.value;
  }

  openModal = () => {
    this.props.editModal.current.open(this);
  }

  componentWillUnmount() {
    this.props.delPrecontrol("chevron");
    this.props.delPostcontrol("properties");
    this.props.delPostcontrol("editJSON");
  }

  handleHide = (open) => {
    this.setState({ open: open });
    this.props.state.collapsed = !open;
  }

  valueChange = (key, newValue) => {
    let tmp = this.state.value;
    tmp[key] = newValue;
  }

  propertyConstraint = (property) => {
    const constraints = this.props.constraints;
    if (constraints.properties !== undefined && constraints.properties[property] !== undefined)
      return constraints.properties[property];
    if (constraints.patternProperties !== undefined) {
      for (let pattern of Object.keys(constraints.patternProperties)) {
        if (RegExp(pattern).test(property)) {
          return constraints.patternProperties[pattern];
        }
      }
    }
    if (constraints.additionalProperties !== undefined)
      return constraints.additionalProperties;
    return new EmptySchema();
  }

  render() {
    if (!this.state.open) {
      return "";
    }
    const subEditors = Object.keys(this.state.value)
      .sort((a, b) => {
        let i = this.propertyConstraint(a).propertyOrder;
        let j = this.propertyConstraint(b).propertyOrder;
        if (i === undefined)
          i = 1000;
        if (j === undefined)
          j = 1000;
        return i - j;
      }).map((key) => {
        const state = this.props.state.child(key);
        return (
          <BaseEditor
            state={state}
            defaults={this.props.defaults.child(state)}
            key={key} id={key}
            constraints={this.propertyConstraint(key)}
            value={this.state.value[key]} valueChange={this.valueChange}
            editModal={this.props.editModal}
            onEdit={this.props.onEdit} onConstruct={this.props.onConstruct}
          />);
      })

    const invalid = this.state.invalid;
    let classes = "objectBody mx-2 px-2 border border-top-0 rounded-bottom";
    if (invalid !== undefined)
      classes += " is-invalid";
    if (this.props.constraints.format === "grid") {
      classes += " grid";
    }

    return (
      <div className={classes}>
        {subEditors.length === 0 && <span className="badge badge-secondary mx-1 my-1">No properties</span>}
        {invalid !== undefined && <div className="invalid-feedback">{invalid}</div>}
        {subEditors}
      </div>
    );
  }
}

export default ObjectEditor;