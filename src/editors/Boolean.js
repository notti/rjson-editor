import React, { Component } from 'react';

class Checkbox extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: props.value
        };
    }

    valueChange = (e) => {
        this.setState(prevState => {
            this.props.onEdit(this.props.state.path(), !prevState.value);
            this.props.valueChange(this.props.id, !prevState.value);
            return { value: !prevState.value }
        });
    }

    updateState = (value) => {
        this.setState(prevState => {
            if (prevState.value !== value)
                return { value: value };
        })
    }

    render() {
        const constraints = this.props.constraints;
        return (
            <div className="custom-control custom-checkbox">
                <input type="checkbox" checked={this.state.value} onChange={this.valueChange} className="custom-control-input custom-control-input.checked" readOnly={constraints.const !== undefined}></input>
                <label className="custom-control-label" onClick={this.valueChange}></label>
            </div>
        )
    }
}


class BooleanEditor extends Component {
    constructor(props) {
        super(props)

        this.checkbox = null;

        let value = props.value;
        if (props.constraints.const !== undefined && value !== props.constraints.const) {
            value = props.constraints.const;
            props.valueChange(props.id, value);
        }
        if (value === undefined) {
            if (props.constraints.default !== undefined)
                value = props.constraints.default;
            else
                value = false;
            props.valueChange(props.id, value);
        }

        this.state = {
            value: value
        }

        this.props.addPrecontrol("checkbox", 1000, (
            <Checkbox
                key="checkbox"
                id={this.props.id}
                ref={this.setRef}
                value={this.state.value}
                constraints={this.props.constraints}
                valueChange={this.valueChange}
                state={this.props.state}
                onEdit={this.props.onEdit}
            />));
        if (typeof this.props.onConstruct === "function")
            this.props.onConstruct(this.props.state.path(), {
                getValue: this.getValue.bind(this),
                setValue: this.setValue.bind(this),
                addPrecontrol: this.props.addPrecontrol,
                addPostcontrol: this.props.addPostcontrol
            });
    }

    valueChange = (id, value) => {
        this.props.valueChange(id, value);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.value) {
            return null;
        }
        let value = nextProps.value;

        if (nextProps.constraints.const !== undefined && value !== nextProps.constraints.const) {
            value = nextProps.constraints.const;
            nextProps.valueChange(nextProps.id, value);
        }
        if (value === undefined) {
            if (nextProps.constraints.default !== undefined)
                value = nextProps.constraints.default;
            else {
                value = false;
            }
            nextProps.valueChange(nextProps.id, value);
        }
        return { value: value };
    }

    setRef = (ref) => {
        this.checkbox = ref;
    }

    componentWillUnmount() {
        this.props.delPrecontrol("checkbox");
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.value !== this.state.value)
            this.checkbox.updateState(this.state.value)
    }

    setValue = (val) => {
        if (val === this.state.value)
            return;
        if (typeof val !== "boolean")
            return false;
        if (this.props.constraints.const !== undefined)
            return false; //not setable
        this.props.onEdit(this.props.state.path(), val, "set")
        this.setState({
            value: val
        });
        this.props.valueChange(this.props.id, val);
        return true;
    }

    getValue = () => {
        return this.state.value;
    }

    render() {
        if (this.props.constraints.description === undefined)
            return null
        return <small className="form-text text-muted">{this.props.constraints.description}</small>;
    }
}

export default BooleanEditor;