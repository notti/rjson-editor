import React, { Component } from 'react';

class StringEditor extends Component {
    constructor(props) {
        super(props);

        let value = props.value;

        if(value === undefined) {
            if(props.constraints.const !== undefined)
                value = props.constraints.const;
            else if(props.constraints.default !== undefined)
                value = props.constraints.default;
            else
                value = "";
            props.valueChange(props.id, value);
        }

        this.state = {
            value: value,
            valid: this.props.constraints.validate(value)
        };
    }

    valueChange = (e) => {
        this.props.valueChange(this.props.id, e.target.value);
        this.setState({
            value: e.target.value,
            valid: this.props.constraints.validate(e.target.value)
        });
    }

    render() {
        const constraints = this.props.constraints;
        const valid = this.state.valid;
        let className = 'form-control';
        if (valid !== undefined) {
            className += ' is-invalid';
        }
        return (
            <React.Fragment>
                <input value={this.state.value} onChange={this.valueChange} className={className}></input>
                {constraints.description && <small className="form-text text-muted">{constraints.description}</small>}
                {valid !== undefined && <div className="invalid-feedback">{valid}</div>}
            </React.Fragment>
        )
    }
}

export default StringEditor;