import React, { Component } from 'react';
import { BaseEditor } from '../Editor.js';
import Chevron from './Chevron.js';
import plusImage from 'open-iconic/svg/plus.svg';
import moveImage from 'open-iconic/svg/resize-height.svg';
import xImage from 'open-iconic/svg/ban.svg';
import { DragSource, DropTarget, DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend';

const dragType = 'ArrayItem';

const arrayItemSource = {
    beginDrag(props) {
        return { dragId: props.dragId, originalIndex: props.id };
    },
    endDrag(props, monitor) {
        const { dragId: droppedId, originalIndex } = monitor.getItem();

        if (!monitor.didDrop())
            props.moveItem(droppedId, originalIndex)
    }
}

const arrayItemTarget = {
    canDrop() {
        return false
    },
    hover(props, monitor) {
        const { dragId: draggedId } = monitor.getItem();
        const { dragId: overId } = props;
        if (draggedId !== overId)
            props.moveItem(draggedId, props.findKey(overId))
    }
}

class ArrayItem extends Component {
    render() {
        const { isDragging, connectDragSource, connectDragPreview, connectDropTarget } = this.props;
        let classes = "array-item";
        if (isDragging)
            classes += " dragging"
        return connectDragPreview(connectDropTarget(
            <div className={classes}>
                <BaseEditor
                    state={this.props.state.child(this.props.id)}
                    defaults={this.props.defaults}
                    id={this.props.id}
                    constraints={this.props.constraints}
                    value={this.props.value} valueChange={this.props.valueChange} />
                <button key="arrayDelete"
                    type="button" className="btn btn-sm btn-outline-secondary mx-2 mb-3" tabIndex="-1"
                    onClick={() => { this.props.handleDel(this.props.id) }}>
                    <img src={xImage} alt="plus" className="mr-1 chevron" />Delete
                </button>
                {this.props.moveable &&
                    connectDragSource(<button key="arrayMove"
                        type="button" className="btn btn-sm btn-outline-secondary mx-2 mb-3 move" tabIndex="-1">
                        <img src={moveImage} alt="plus" className="mr-1 chevron" />Move
                    </button>)}
            </div>))
    }
}

const ArrayItemDraggable = DropTarget(dragType, arrayItemTarget, connect => ({
    connectDropTarget: connect.dropTarget()
}))(DragSource(dragType, arrayItemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
}))(ArrayItem));

const arrayTarget = {
    drop() {}
}

class ArrayEditor extends Component {
    constructor(props) {
        super(props);

        this.value = props.value;
        if (this.value === undefined) {
            this.value = []; //FIXME
            props.valueChange(props.id, this.value);
        }
        this.keys = this.value.map((value, index) => (index));
        this.state = { open: !props.defaults.collapsed, invalid: props.constraints.validate(this.value) };
    }

    componentDidMount() {
        this.props.addPrecontrol("arrayChevron", -1000, <Chevron key="arrayChevron" handleHide={this.handleHide} open={this.state.open} />);
        this.props.addPostcontrol("arrayAppend", -1000, <button key="arrayAppend"
            type="button" className="btn btn-sm btn-outline-secondary mx-2" onClick={this.handleAdd}>
            <img src={plusImage} alt="plus" className="mr-1 symbol" />Append item
            </button>)
    }

    componentWillUnmount() {
        this.props.delPrecontrol("arrayChevron");
        this.props.delPostcontrol("arrayAppend");
    }

    handleHide = (open) => {
        this.setState({ open: open });
    }

    valueChange = (key, newValue) => {
        this.value[key] = newValue;
    }

    handleAdd = () => {
        this.value.push(undefined);
        this.keys.push(this.keys.length === 0 ? 0 : this.keys.reduce((max, val) => val > max ? val : max, this.keys[0]) + 1);
        this.setState({ invalid: this.props.constraints.validate(this.value) })
    }

    handleDel = (index) => {
        this.value.splice(index, 1);
        this.keys.splice(index, 1);
        this.setState({ invalid: this.props.constraints.validate(this.value) })
    }

    findKey = (key) => {
        return this.keys.indexOf(key);
    }

    moveItem = (dragged, b) => {
        const a = this.findKey(dragged);
        this.value.splice(b, 0, this.value.splice(a, 1)[0]);
        this.keys.splice(b, 0, this.keys.splice(a, 1)[0]);
        this.forceUpdate();
    }

    propertyConstraint = (index) => {
        const constraints = this.props.constraints;
        if (Array.isArray(constraints.items)) {
            if (index >= this.value.length)
                return constraints.additionalItems;
            return constraints.items[index];
        }
        return constraints.items;
    }

    render() {
        if (!this.state.open) {
            return "";
        }
        const { connectDropTarget } = this.props;
        const subEditors = this.value.map((value, id) => (
            <ArrayItemDraggable
                state={this.props.state}
                defaults={this.props.defaults}
                key={this.keys[id]} dragId={this.keys[id]} id={id}
                constraints={this.propertyConstraint(id)}
                value={this.value[id]} valueChange={this.valueChange}
                moveable={this.value.length > 1} moveItem={this.moveItem} findKey={this.findKey}
                handleDel={this.handleDel}
            />)
        );

        const invalid = this.state.invalid;
        let classes = "objectBody mx-2 px-2 border border-top-0 rounded-bottom";
        if (invalid !== undefined)
            classes += " is-invalid";

        return connectDropTarget(
            <div className={classes}>
                {subEditors.length === 0 && <span className="badge badge-secondary mx-1 my-1">No items</span>}
                {invalid !== undefined && <div className="invalid-feedback">{invalid}</div>}
                {subEditors}
            </div>
        );
    }
}

export default DragDropContext(HTML5Backend)(DropTarget(dragType, arrayTarget, connect => ({
    connectDropTarget: connect.dropTarget()
}))(ArrayEditor));