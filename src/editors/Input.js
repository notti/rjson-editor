import React, { Component } from 'react';
import { constants } from 'zlib';


class SelectEditor extends Component {
    valueChange = (e) => {
        let value = e.target.value;
        if (value === "" && this.props.defaults.optionalPropertiesAlways === true)
            value = undefined;
        this.props.onEdit(this.props.state.path(), value);
        this.props.valueChange(this.props.id, value);
    }

    render() {
        let className = 'custom-select';
        if (this.props.valid !== undefined) {
            className += ' is-invalid';
        }
        let values = [];
        if (this.props.defaults.optionalPropertiesAlways === true)
            values.push(<option key="" value=""></option>)
        values = values.concat(this.props.constraints.enum.map((val) => (<option key={val} value={val}>{val}</option>)))
        return (
            <select value={this.props.value || ""} className={className} onChange={this.valueChange}>
                {values}
            </select>
        )
    }
}


class StringEditor extends Component {
    valueChange = (e) => {
        let value = e.target.value;
        if (value === "" && this.props.defaults.optionalPropertiesAlways === true)
            value = undefined;
        this.props.onEdit(this.props.state.path(), value);
        this.props.valueChange(this.props.id, value);
    }

    render() {
        let className = 'form-control';
        if (this.props.valid !== undefined) {
            className += ' is-invalid';
        }
        return (
            <input value={this.props.value || ""} onChange={this.valueChange} className={className}></input>
        )
    }
}

class IntegerEditor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: (props.value === undefined ? "" : props.value),
            realValue: props.value
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.realValue) {
            return null;
        }

        return {
            value: (nextProps.value === undefined ? "" : nextProps.value),
            realValue: nextProps.value
        }
    }

    valueChange = (e) => {
        let textValue = e.target.value;

        if (textValue === "-0" || textValue === "0-" || textValue === "-")
            textValue = "-";
        else if (!(textValue === "" || textValue === "0" || /^-?[1-9][0-9]*$/.test(textValue)))
            return false;
        let value = sanitize(textValue, this.props.constraints, this.props.defaults);

        this.props.onEdit(this.props.state.path(), value);
        this.props.valueChange(this.props.id, value);
        this.setState({ value: textValue, realValue: value })
        return true;
    }

    onBlur = (e) => {
        this.setState(prevState => ({
            value: (prevState.realValue === undefined ? "" : prevState.realValue)
        }))
    }

    onKeyDown = (e) => {
        if (e.key === "Enter")
            this.onBlur();
    }

    render() {
        let className = 'form-control';
        if (this.props.valid !== undefined) {
            className += ' is-invalid';
        }
        return (
            <input value={this.state.value} onChange={this.valueChange} className={className} onBlur={this.onBlur} onKeyDown={this.onKeyDown} ></input>
        )
    }
}

class NumberEditor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: (props.value === undefined ? "" : props.value),
            realValue: props.value
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.realValue) {
            return null;
        }

        return {
            value: (nextProps.value === undefined ? "" : nextProps.value),
            realValue: nextProps.value
        }
    }

    valueChange = (e) => {
        let textValue = e.target.value;

        switch (textValue) {
            case "0-":
                textValue = "-";
            case "-":
            case ".":
            case "-.":
            case "":
                break;
            default:
                let fakeValue = textValue;
                if (fakeValue.substr(-1) === "e" && fakeValue.split('e').length <= 2)
                    fakeValue = fakeValue.substr(0, fakeValue.length - 1)
                if (fakeValue.substr(-2) === "e-" && fakeValue.split('e').length <= 2)
                    fakeValue = fakeValue.substr(0, fakeValue.length - 2)
                if (fakeValue.substr(-2) === "e+" && fakeValue.split('e').length <= 2)
                    fakeValue = fakeValue.substr(0, fakeValue.length - 2)
                if (fakeValue.substr(-1) === "." && fakeValue.split('.').length <= 2)
                    fakeValue = fakeValue.substr(0, fakeValue.length - 1)
                if (!Number.isFinite(Number(fakeValue)))
                    return false;
        }
        let value = sanitize(textValue, this.props.constraints, this.props.defaults);

        this.props.onEdit(this.props.state.path(), value);
        this.props.valueChange(this.props.id, value);
        this.setState({ value: textValue, realValue: value })
        return true;
    }

    onBlur = (e) => {
        this.setState(prevState => ({
            value: (prevState.realValue === undefined ? "" : prevState.realValue)
        }))
    }

    onKeyDown = (e) => {
        if (e.key === "Enter")
            this.onBlur();
    }

    render() {
        let className = 'form-control';
        if (this.props.valid !== undefined) {
            className += ' is-invalid';
        }
        return (
            <input value={this.state.value} onChange={this.valueChange} className={className} onBlur={this.onBlur} onKeyDown={this.onKeyDown} ></input>
        )
    }
}

function sanitize(value, constraints, defaults) {
    if (constraints.enum !== undefined) {
        if (constraints.enum.indexOf(value) >= 0)
            return value;
        if (defaults.optionalPropertiesAlways === true)
            return undefined;
        if (constraints.default !== undefined)
            return constraints.default;
        return constraints.enum[0];
    }
    if ((value === "" || value === undefined) && defaults.optionalPropertiesAlways === true)
        return undefined;
    switch (constraints.type) {
        case "string":
            if (typeof value === "string")
                return value;
            if (constraints.default !== undefined)
                return constraints.default;
            return "";
        case "integer":
            value = Number(value);
            if (Number.isNaN(value))
                if (constraints.default !== undefined)
                    return constraints.default;
                else if (defaults.optionalPropertiesAlways === true)
                    return undefined;
                else
                    return 0;
            if (Number.isInteger(value))
                return value;
            return Math.floor(value)
        case "number":
            value = Number(value);
            if (Number.isNaN(value))
                if (constraints.default !== undefined)
                    return constraints.default;
                else if (defaults.optionalPropertiesAlways === true)
                    return undefined;
                else
                    return 0;
            return value;
        // no default
    }
}

class InputEditor extends Component {
    constructor(props) {
        super(props);

        const constraints = props.constraints;
        let value = props.value;

        if (constraints.const !== undefined && constraints.const !== value) {
            value = constraints.const;
            props.valueChange(props.id, constraints.const);
            if (value !== undefined)
                props.onEdit(props.state.path(), constraints.const, "set");
        }
        const sanitized = sanitize(value, constraints, props.defaults)
        if (sanitized !== value) {
            value = sanitized;
            props.valueChange(props.id, sanitized);
        }

        if (typeof this.props.onConstruct === "function")
            this.props.onConstruct(this.props.state.path(), {
                getValue: this.getValue.bind(this),
                setValue: this.setValue.bind(this),
                addPrecontrol: props.addPrecontrol,
                addPostcontrol: props.addPostcontrol
            });

        this.state = {
            value: value,
            valid: constraints.validate(value || "")
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.value) {
            return null;
        }

        const constraints = nextProps.constraints;
        let value = nextProps.value;

        if (constraints.const !== undefined && constraints.const !== value) {
            value = constraints.const;
            nextProps.valueChange(nextProps.id, constraints.const);
            nextProps.onEdit(nextProps.state.path(), constraints.const, "set");
        } else {
            value = sanitize(value, constraints, nextProps.defaults);
        }

        return {
            value: value,
            valid: constraints.validate(value || "")
        }
    }

    getValue = () => {
        return this.state.value;
    }

    setValue = (value) => {
        if (value === this.state.value)
            return;
        if (this.props.constraints.const !== undefined)
            return false; //not setable

        const sanitized = sanitize(value, this.props.constraints, this.props.defaults);

        this.props.onEdit(this.props.state.path(), sanitized, "set");
        this.props.valueChange(this.props.id, sanitized);
        this.setState({
            value: sanitized,
            valid: this.props.constraints.validate(sanitized)
        });
        return sanitized === value;
    }

    render() {
        const constraints = this.props.constraints;
        const type = constraints.type;
        const valid = this.state.valid;
        let control;
        if (constraints.const !== undefined)
            control = <input type="text" value={this.state.value} className="form-control" readOnly></input>;
        else {
            let Control
            if (constraints.enum !== undefined)
                Control = SelectEditor;
            else if (type == "string")
                Control = StringEditor;
            else if (type == "integer")
                Control = IntegerEditor;
            else
                Control = NumberEditor;
            control = (<Control
                id={this.props.id} value={this.state.value} valid={valid}
                constraints={constraints}
                onEdit={this.props.onEdit} valueChange={this.props.valueChange}
                defaults={this.props.defaults} state={this.props.state} />
            );
        }

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