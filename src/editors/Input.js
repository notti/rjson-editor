import React, { Component } from 'react';

class InputEditor extends Component {
    constructor(props) {
        super(props);

        let value = props.value;

        if (props.constraints.const !== undefined && value !== props.constraints.const) {
            value = props.constraints.const;
            props.valueChange(props.id, value);
        }
        if (value === undefined) {
            if (props.constraints.default !== undefined)
                value = props.constraints.default;
            else {
                if (props.constraints.type === "string")
                    value = "";
                else
                    value = 0;
            }
            props.valueChange(props.id, value);
        }

        this.state = {
            value: value,
            valid: this.props.constraints.validate(value)
        };
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