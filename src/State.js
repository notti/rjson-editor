export default class State {
    constructor(path, id) {
        this._states = {};
        if (path === undefined)
            this._path = []
        else
            this._path = path.concat(id);
    }
    getPath = () => {
        return this.path.join('.');
    }
    child = (id) => {
        if (this._states[id] === undefined)
            this._states[id] = new State(this._path, id);
        return this._states[id];
    }
}
