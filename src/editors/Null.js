import React, { Component } from 'react';

class NullEditor extends Component {
    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value !== null) {
            nextProps.valueChange(nextProps.id, null);
        }
        return null;
    }

    render() {
        return (
            <input value="null" className="form-control" readOnly />
        );
    }
}

export default NullEditor;