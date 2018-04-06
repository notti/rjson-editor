import React, { Component } from 'react';
import { BaseEditor } from '../Editor.js';
import Chevron from './Chevron.js';
import plusImage from 'open-iconic/svg/plus.svg';
import moveImage from 'open-iconic/svg/resize-height.svg';
import xImage from 'open-iconic/svg/delete.svg';
import { DragSource, DropTarget, DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend';

const dragType = 'ArrayItem';

const arrayItemSource = {
    beginDrag(props) {
        return { dragId: props.dragId, originalIndex: props.id, path: props.path };
    },
    endDrag(props, monitor) {
        const { dragId: droppedId, originalIndex } = monitor.getItem();

        if (!monitor.didDrop())
            props.moveItem(droppedId, originalIndex)
        else
            props.onEdit([props.findKey(droppedId), originalIndex], "change")
    }
}

const arrayItemTarget = {
    canDrop() {
        return false
    },
    hover(props, monitor) {
        const { dragId: draggedId, path: draggedPath } = monitor.getItem();
        const { dragId: overId, path: overPath } = props;
        if (draggedPath === overPath && draggedId !== overId)
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
                    value={this.props.value} valueChange={this.props.valueChange}
                    short={this.props.short}
                    editModal={this.props.editModal}
                    onEdit={this.props.onEdit}
                />
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
    canDrop(props, monitor) {
        return props.state.path() === monitor.getItem().path;
    },
    drop() { }
}

class ArrayEditor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: !props.defaults.collapsed,
            value: [],
            keys: [],
            invalid: undefined
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.value) {
            return null;
        }

        let value = nextProps.value;
        const constraints = nextProps.constraints;
        if (value === undefined) {
            if (constraints.default !== undefined) {
                value = JSON.parse(JSON.stringify(constraints.default));
            } else {
                value = [];
            }
            nextProps.valueChange(nextProps.id, value);
        }
        return {
            value: value,
            keys: value.map((value, index) => (index)),
            valid: nextProps.constraints.validate(value)
        };
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
        let tmp = this.state.value;
        tmp[key] = newValue;
    }

    handleAdd = () => {
        this.props.onEdit(this.props.state.path(), undefined, "add")
        let tmp = this.state.value;
        tmp.push(undefined);
        tmp = this.state.keys;
        tmp.push(tmp.length === 0 ? 0 : tmp.reduce((max, val) => val > max ? val : max, this.state.keys[0]) + 1);
        this.setState({ invalid: this.props.constraints.validate(this.state.value) })
    }

    handleDel = (index) => {
        this.props.onEdit(this.props.state.path(), index, "del")
        let tmp = this.state.value;
        tmp.splice(index, 1);
        tmp = this.state.keys;
        tmp.splice(index, 1);
        this.setState({ invalid: this.props.constraints.validate(this.state.value) })
    }

    findKey = (key) => {
        return this.state.keys.indexOf(key);
    }

    moveItem = (dragged, b) => {
        const a = this.findKey(dragged);
        let tmp = this.state.value;
        tmp.splice(b, 0, tmp.splice(a, 1)[0]);
        tmp = this.state.keys;
        tmp.splice(b, 0, tmp.splice(a, 1)[0]);
        this.forceUpdate();
    }

    propertyConstraint = (index) => {
        const constraints = this.props.constraints;
        if (Array.isArray(constraints.items)) {
            if (index >= this.state.value.length)
                return constraints.additionalItems;
            return constraints.items[index];
        }
        return constraints.items;
    }

    onEdit = (b, c) => {
        this.props.onEdit(this.props.state.path(), b, c);
    }

    render() {
        if (!this.state.open) {
            return "";
        }
        const { connectDropTarget } = this.props;
        const subEditors = this.state.value.map((value, id) => (
            <ArrayItemDraggable
                state={this.props.state} path={this.props.state.path()}
                defaults={this.props.defaults}
                key={this.state.keys[id]} dragId={this.state.keys[id]} id={id}
                constraints={this.propertyConstraint(id)}
                value={this.state.value[id]} valueChange={this.valueChange}
                moveable={this.state.value.length > 1} moveItem={this.moveItem} findKey={this.findKey}
                handleDel={this.handleDel}
                short={this.props.constraints.format === "table"}
                editModal={this.props.editModal}
                onEdit={this.props.onEdit}
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