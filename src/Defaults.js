class Defaults {
    constructor(defaults, state, object, parentobject) {
        this._defaults = defaults;
        this._state = state;
        this._object = !!object;
        this._parentobject = !!parentobject
    }

    child(state) {
        return new Defaults(this._defaults, state, false, this._object);
    }

    apply(constraints) {
        if (constraints.type === "object")
            return new Defaults(this._defaults, this._state, true);
        else
            return this;
    }

    get collapsed() {
        if (typeof this._defaults.collapsed !== "function") {
            return !!this._defaults.collapsed;
        }
        return !!this._defaults.collapsed(this._state.path());
    }

    get optionalPropertiesTrue() {
        if (typeof this._defaults.optionalPropertiesTrue !== "function") {
            return !!this._defaults.optionalPropertiesTrue;
        }
        return !!this._defaults.optionalPropertiesTrue(this._state.path());
    }

    get optionalPropertiesAlways() {
        if (!(this._object || this._parentobject))
            return false;
        if (typeof this._defaults.optionalPropertiesAlways !== "function") {
            return !!this._defaults.optionalPropertiesAlways;
        }
        return !!this._defaults.optionalPropertiesAlways(this._state.path());
    }
}

export default Defaults;
