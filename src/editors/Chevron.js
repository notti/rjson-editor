import React, { Component } from 'react';
import { ChevronRight, ChevronDown } from 'react-feather';


class Chevron extends Component {
    constructor(props) {
        super(props);

        this.state = { open: props.open };
    }

    handleHide = (e) => {
        e.preventDefault();
        this.setState((prevState) => {
            let open = !prevState.open;
            this.props.handleHide(open);
            return { open: open }
        })
    }

    render() {
        const button = this.state.open ? (
            <ChevronDown className="chevron" />
        ) : (
            <ChevronRight className="chevron" />
            );

        return (
            <a href="#collapse" className="mr-2" onClick={this.handleHide}>{button}</a>
        );
    }
}

export default Chevron;