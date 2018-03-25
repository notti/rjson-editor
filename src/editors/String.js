import React, { Component } from 'react';

class StringEditor extends Component {
    constructor(props) {
        super(props);

        let value = props.value;

        if(value === undefined) {
            value = "";
            props.valueChange(props.id, value);
        }

        this.state = {
            value: value,
            valid: this.validate(value)
        };
    }

    valueChange = (e) => {
        this.props.valueChange(this.props.id, e.target.value);
        this.setState({
            value: e.target.value,
            valid: this.validate(e.target.value)
        });
    }

    validate = (text) => {
        const schema = this.props.schema;
        if(schema.minLength !== undefined)
            if(text.length < schema.minLength)
                return "Must be at least "+schema.minLength+" characters.";
        if(schema.maxLength !== undefined)
            if(text.length > schema.maxLength)
                return "Must be at most "+schema.maxLength+" characters.";
        if(schema.pattern !== undefined)
            if(!RegExp(schema.pattern).test(text))
                return "Must fulfill regular expression '"+schema.pattern+"'.";
        return true;
    }

    render() {
        const schema = this.props.schema;
        const valid = this.state.valid;
        let className = 'form-control';
        if (valid !== true) {
            className += ' is-invalid';
        }
        return (
            <React.Fragment>
                <input value={this.state.value} onChange={this.valueChange} className={className}></input>
                {schema.description && <small className="form-text text-muted">{schema.description}</small>}
                {valid !== true && <div className="invalid-feedback">{valid}</div>}
            </React.Fragment>
        )
    }
}

export default StringEditor;