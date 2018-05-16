import React, { Component } from 'react';

class Checkbox extends Component {
    constructor(props) {
        super(props);

        this.checkbox = React.createRef();
        this.state = {
            value: props.value
        };
    }

    componentDidMount() {
        this.checkbox.current.indeterminate = this.state.value === undefined;
    }

    componentDidUpdate() {
        this.checkbox.current.indeterminate = this.state.value === undefined;
    }

    valueChange = (e) => {
        this.setState((prevState, props) => {
            let newState;
            if (props.defaults.optionalPropertiesAlways === true) {
                switch (prevState.value) {
                    case undefined: newState = false; break;
                    case false: newState = true; break;
                    case true: newState = undefined; break;
                    // no default
                }
            } else {
                newState = !prevState.value;
            }
            props.onEdit(this.props.state.path(), newState);
            props.valueChange(this.props.id, newState);
            return { value: newState }
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
                <input type="checkbox" checked={this.state.value === true} onChange={this.valueChange} className="custom-control-input" readOnly={constraints.const !== undefined} ref={this.checkbox} ></input>
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
        if (typeof value !== "boolean")
            value = undefined;
        if (value === undefined) {
            if (props.constraints.default !== undefined) {
                value = props.constraints.default;
                props.valueChange(props.id, value);
            } else if (props.defaults.optionalPropertiesAlways !== true) {
                value = false;
                props.valueChange(props.id, value);
            }
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
                defaults={this.props.defaults}
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
        if (typeof value !== "boolean")
            value = undefined;
        if (value === undefined) {
            if (nextProps.constraints.default !== undefined) {
                value = nextProps.constraints.default;
                nextProps.valueChange(nextProps.id, value);
            } else if (nextProps.defaults.optionalPropertiesAlways !== true) {
                value = false;
                nextProps.valueChange(nextProps.id, value);
            }
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