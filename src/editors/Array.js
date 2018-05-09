import React, { Component } from 'react';
import { BaseEditor } from '../Editor.js';
import Chevron from './Chevron.js';
import { PlusSquare, Shuffle, Trash2 } from 'react-feather';
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
                    onEdit={this.props.onEdit} onConstruct={this.props.onConstruct}
                />
                <button key="arrayDelete"
                    type="button" className="btn btn-sm btn-outline-secondary mx-2 mb-3" tabIndex="-1"
                    onClick={() => { this.props.handleDel(this.props.id) }}>
                    <Trash2 /> Delete
                </button>
                {this.props.moveable &&
                    connectDragSource(<button key="arrayMove"
                        type="button" className="btn btn-sm btn-outline-secondary mx-2 mb-3 move" tabIndex="-1">
                        <Shuffle /> Move
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

        let collapsed = props.state.collapsed
        if (collapsed === undefined) {
            collapsed = props.defaults.collapsed;
            if (typeof collapsed === "function")
                collapsed = collapsed(props.state.path());
            props.state.collapsed = !!collapsed;
        }

        this.state = {
            open: !collapsed,
            value: [],
            keys: [],
            valid: props.constraints.validate([])
        };

        this.props.addPrecontrol("arrayChevron", -1000, <Chevron key="arrayChevron" handleHide={this.handleHide} open={this.state.open} />);
        this.props.addPostcontrol("arrayAppend", -1000, <button key="arrayAppend"
            type="button" className="btn btn-sm btn-outline-secondary mx-2" onClick={this.handleAdd}>
            <PlusSquare /> Append item
            </button>)
        if (typeof this.props.onConstruct === "function")
            this.props.onConstruct(this.props.state.path(), {
                getValue: this.getValue.bind(this),
                setValue: this.setValue.bind(this),
                addPrecontrol: this.props.addPrecontrol,
                addPostcontrol: this.props.addPostcontrol
            });
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.value === prevState.value) {
            return null;
        }

        let value = nextProps.value;
        const constraints = nextProps.constraints;
        if (value === undefined || !Array.isArray(value)) {
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

    componentWillUnmount() {
        this.props.delPrecontrol("arrayChevron");
        this.props.delPostcontrol("arrayAppend");
    }

    handleHide = (open) => {
        this.setState({ open: open });
        this.props.state.collapsed = !open;
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

    setValue = (val) => {
        if (JSON.stringify(val) === JSON.stringify(this.state.value))
            return;
        if (!Array.isArray(val))
            return;
        this.props.onEdit(this.props.state.path(), val, "set")
        this.setState({
            value: val,
            keys: val.map((value, index) => (index)),
            valid: this.props.constraints.validate(val)
        });
        this.props.valueChange(this.props.id, val);
    }

    getValue = () => {
        return this.state.value;
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
                onEdit={this.props.onEdit} onConstruct={this.props.onConstruct}
            />)
        );

        const valid = this.state.valid;
        let classes = "objectBody mx-2 px-2 border border-top-0 rounded-bottom";
        if (valid !== undefined)
            classes += " is-invalid";

        return connectDropTarget(
            <div className={classes}>
                {subEditors.length === 0 && <span className="badge badge-secondary mx-1 my-1">No items</span>}
                {valid !== undefined && <div className="invalid-feedback">{valid}</div>}
                {subEditors}
            </div>
        );
    }
}

export default DragDropContext(HTML5Backend)(DropTarget(dragType, arrayTarget, connect => ({
    connectDropTarget: connect.dropTarget()
}))(ArrayEditor));