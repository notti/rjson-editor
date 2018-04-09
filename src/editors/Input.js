import React, { Component } from 'react';

class InputEditor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: "",
            valid: props.constraints.validate("")
        }
        if (typeof this.props.onConstruct === "function")
            this.props.onConstruct(this.props.state.path(), {
                getValue: this.getValue.bind(this),
                setValue: this.setValue.bind(this),
                addPrecontrol: this.props.addPrecontrol,
                addPostcontrol: this.props.addPostcontrol
            });
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.value) {
            return null;
        }
        let textValue = nextProps.value;
        let value = textValue;
        const { const: c, default: d, type: t } = nextProps.constraints;

        if (c !== undefined && textValue !== c) {
            textValue = value = c;
            nextProps.valueChange(nextProps.id, textValue);
        } else if (textValue === undefined) {
            if (d !== undefined)
                textValue = value = d;
            else {
                if (t === "string")
                    textValue = value = "";
                else {
                    value = 0;
                    textValue = "";
                }
            }
            nextProps.valueChange(nextProps.id, textValue);
        }

        return {
            value: textValue,
            valid: nextProps.constraints.validate(value)
        };
    }

    setValue = (value) => {
        if (value === this.state.value)
            return;
        if (this.props.constraints.const !== undefined)
            return false; //not setable
        let textValue = value;
        switch (this.props.constraints.type) {
            case "integer":
                if (value === "") {
                    textValue = "";
                    value = 0;
                } else if (value === "-") {
                    textValue = "-";
                    value = 0;
                } else if (/^-?[0-9]+$/.test(value)) {
                    textValue = value = Number(value);
                } else {
                    return false;
                }
                break;
            case "number":
                if (value === "") {
                    textValue = "";
                    value = 0;
                } else if (value === "-") {
                    textValue = "-";
                    value = 0;
                } else {
                    textValue = value = Number(value);
                    if (!Number.isFinite(value))
                        return false;
                }
                break;
            // no default
        }
        this.props.onEdit(this.props.state.path(), value, "set");
        this.props.valueChange(this.props.id, value);
        this.setState({
            value: textValue,
            valid: this.props.constraints.validate(value)
        });
        return true;
    }

    getValue = () => {
        return this.state.value;
    }

    valueChange = (e) => {
        let value = e.target.value;
        let textValue = value;
        switch (this.props.constraints.type) {
            case "integer":
                if (value === "") {
                    textValue = "";
                    value = 0;
                } else if (value === "-") {
                    textValue = "-";
                    value = 0;
                } else if (/^-?[0-9]+$/.test(value)) {
                    textValue = value = Number(value);
                } else {
                    return;
                }
                break;
            case "number":
                if (value === "") {
                    textValue = "";
                    value = 0;
                } else if (value === "-") {
                    textValue = "-";
                    value = 0;
                } else {
                    textValue = value = Number(value);
                    if (!Number.isFinite(value))
                        return;
                }
                break;
            // no default
        }
        this.props.onEdit(this.props.state.path(), value);
        this.props.valueChange(this.props.id, value);
        this.setState({
            value: textValue,
            valid: this.props.constraints.validate(value)
        });
    }

    render() {
        const constraints = this.props.constraints;
        const valid = this.state.valid;
        let className = (constraints.enum !== undefined ? 'custom-select' : 'form-control');
        if (valid !== undefined) {
            className += ' is-invalid';
        }
        const control = (constraints.enum !== undefined ?
            <select value={this.state.value} className={className} onChange={this.valueChange}>
                {[""].concat(constraints.enum).map((val) => (<option key={val} value={val}>{val}</option>))}
            </select> :
            <input value={this.state.value} onChange={this.valueChange} className={className} readOnly={constraints.const !== undefined}></input>
        );
        return (
            <React.Fragment>
                {control}
                {constraints.description && <small className="form-text text-muted">{constraints.description}</small>}
                {valid !== undefined && <div className="invalid-feedback">{valid}</div>}
            </React.Fragment>
        )
    }
}

export default InputEditor;