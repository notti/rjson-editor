import React, { Component } from 'react';

class NullEditor extends Component {
    constructor(props) {
        super(props);

        if (typeof this.props.onConstruct === "function")
            this.props.onConstruct(this.props.state.path(), {
                getValue: this.getValue.bind(this),
                setValue: this.setValue.bind(this),
                addPrecontrol: this.props.addPrecontrol,
                addPostcontrol: this.props.addPostcontrol
            });
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