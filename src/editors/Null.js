import React, { Component } from 'react';

class NullEditor extends Component {
    constructor(props) {
        super(props);

        if (typeof props.events.onConstruct === "function")
            props.events.onConstruct(props.state.path(), {
                getValue: this.getValue.bind(this),
                setValue: this.setValue.bind(this),
                addPrecontrol: props.addPrecontrol,
                addPostcontrol: props.addPostcontrol,
                delPrecontrol: props.delPrecontrol,
                delPostcontrol: props.delPostcontrol
            }, props.constraints);
    }

    componentWillUnmount() {
        if (typeof this.props.events.onDestruct === "function")
            this.props.events.onDestruct(this.props.state.path(), {
                getValue: this.getValue.bind(this),
                delPrecontrol: this.props.delPrecontrol,
                delPostcontrol: this.props.delPostcontrol
            }, this.props.constraints);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value !== null) {
            nextProps.valueChange(nextProps.id, null);
        }
        return null;
    }

    setValue = (val) => {
        return false; //not setable
    }

    getValue = () => {
        return null;
    }

    render() {
        return (
            <input value="null" className="form-control" readOnly />
        );
    }
}

export default NullEditor;