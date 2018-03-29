import React, { Component } from 'react';

class Checkbox extends Component {
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
                value = false;
            }
            props.valueChange(props.id, value);
        }

        this.state = {
            value: value
        };
    }

    valueChange = (e) => {
        this.setState(prevState => {
            this.props.valueChange(this.props.id, !prevState.value);
            return { value: !prevState.value }
        });
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
    componentDidMount() {
        this.props.addPrecontrol("checkbox", 1000, (
            <Checkbox
                key="checkbox"
                id={this.props.id}
                value={this.props.value}
                constraints={this.props.constraints}
                valueChange={this.props.valueChange}
            />));
    }

    componentWillUnmount() {
        this.props.delPrecontrol("checkbox");
    }

    render() {
        if (this.props.constraints.description === undefined)
            return null
        return <small className="form-text text-muted">{this.props.constraints.description}</small>;
    }
}

export default BooleanEditor;