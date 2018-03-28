import React, { Component } from 'react';
import chevronRight from 'open-iconic/svg/chevron-right.svg'
import chevronBottom from 'open-iconic/svg/chevron-bottom.svg'

import { BaseEditor } from '../Editor.js';

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
      <a href="#collapse" onClick={this.handleHide}>{button}</a>
    );
  }
}

class ObjectEditor extends Component {
  constructor(props) {
    super(props);

    this.state = { open: !props.defaults.collapsed };
    this.value = props.value;
    if (this.value === undefined) {
      this.value = {} //FIXME
      props.valueChange(props.id, this.value);
    }
  }

  componentDidMount() {
    this.props.setChevron(<Chevron handleHide={this.handleHide} open={this.state.open} />);
  }

  componentWillUnmount() {
    this.props.setChevron(null);
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

    const subEditors = Object.keys(properties)
      .sort((a, b) => {
        let i = properties[a].propertyOrder;
        let j = properties[b].propertyOrder;
        if (i === undefined)
          i = 1000;
        if (j === undefined)
          j = 1000;
        return i-j;
      }).
      map((key) => {

        if (this.value[key] === undefined) { //FIXME
          this.value[key] = undefined;
        }

        return (
          <BaseEditor
            defaults={this.props.defaults}
            key={key} id={key}
            schema={properties[key]}
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