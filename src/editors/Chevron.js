import React, { Component } from 'react';
import chevronRight from 'open-iconic/svg/chevron-right.svg'
import chevronBottom from 'open-iconic/svg/chevron-bottom.svg'


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
            <img src={chevronBottom} alt="close" className="chevron" />
        ) : (
                <img src={chevronRight} alt="open" className="chevron" />
            );

        return (
            <a href="#collapse" className="mr-2" onClick={this.handleHide}>{button}</a>
        );
    }
}

export default Chevron;