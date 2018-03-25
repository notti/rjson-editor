import React, { Component } from 'react';

class StringEditor extends Component {
    constructor(props) {
        super(props);

        this.state = { value: props.value };
    }

    valueChange = (e) => {
        this.props.valueChange(this.props.id, e.target.value);
        this.setState({ value: e.target.value });
    }

    render() {
        const json = this.props.json;
        return (
            <React.Fragment>
                <input value={this.state.value} onChange={this.valueChange} className="form-control"></input>
                {json.description && <small className="form-text text-muted">{json.description}</small>}
            </React.Fragment>
        )
    }
}

export default StringEditor;