import React, { Component } from 'react';

class NullEditor extends Component {
    constructor(props) {
        super(props);

        if (props.value === undefined) {
            props.valueChange(props.id, null);
        }
    }

    render() {
        return (
            <input value="null" className="form-control" readOnly />
        );
    }
}

export default NullEditor;