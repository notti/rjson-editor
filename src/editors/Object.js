import React, { Component } from 'react';
import chevronRight from 'open-iconic/svg/chevron-right.svg'
import chevronBottom from 'open-iconic/svg/chevron-bottom.svg'

import { BaseEditor } from '../Editor.js';

class Chevron extends Component {
  constructor(props) {
    super(props);

    this.state = {open: props.open};
  }

  handleHide = (e) => {
    e.preventDefault();
    this.setState((prevState) => {
      let open=!prevState.open;
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
  }

  componentDidMount() {
    this.props.setChevron(<Chevron handleHide={this.handleHide} open={this.state.open} />);
  }

  componentWillUnmount() {
    this.props.setChevron(null);
  }

  handleHide = (open) => {
    this.setState({open: open});
  }

  valueChange = (key, newValue) => {
    this.value[key] = newValue;
    this.props.valueChange();
  }

  render() {
    if (!this.state.open) {
      return "";
    }
    const properties = this.props.json.properties;

    const subEditors = Object.keys(properties).map((key) => {
      const object = properties[key];
      return (
      <BaseEditor
        defaults={this.props.defaults}
        key={key} id={key}
        json={object}
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