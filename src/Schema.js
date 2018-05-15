import ObjectEditor from './editors/Object.js';
import InputEditor from './editors/Input.js';
import BooleanEditor from './editors/Boolean.js';
import NullEditor from './editors/Null.js';
import ArrayEditor from './editors/Array.js';

const editorTypes = {
    "object": ObjectEditor,
    "string": InputEditor,
    "number": InputEditor,
    "integer": InputEditor,
    "boolean": BooleanEditor,
    "null": NullEditor,
    "array": ArrayEditor
}

class Constraints {
    constructor(type, constraints, fullschema) {
        this.type = type;
        this.const = constraints.const
        this.enum = constraints.enum
        if (this.const === undefined && this.enum !== undefined && this.enum.length === 1) {
            this.const = this.enum[0];
            this.enum = undefined;
        }
        this.format = constraints.format
        switch (type) {
            case "array":
                if (constraints.items !== undefined) {
                    if (Array.isArray(constraints.items)) {
                        this.items = constraints.items.map(val => (new PseudoSchema(val, fullschema.fullschema)));
                    } else {
                        this.items = new PseudoSchema(constraints.items, fullschema.fullschema);
                    }
                }
                if (constraints.additionalItems !== undefined)
                    this.additionalItems = new PseudoSchema(constraints.additionalItems, fullschema.fullschema);
                break;
            case "object":
                this.required = constraints.required;
                if (constraints.properties !== undefined) {
                    this.properties = {}
                    let keys = Object.keys(constraints.properties);
                    for (let i = 0; i < keys.length; i++) {
                        this.properties[keys[i]] = new PseudoSchema(constraints.properties[keys[i]], fullschema.fullschema);
                    }
                }
                if (constraints.patternProperties !== undefined) {
                    this.patternProperties = {}
                    let keys = Object.keys(constraints.patternProperties);
                    for (let i = 0; i < keys.length; i++) {
                        this.patternProperties[keys[i]] = new PseudoSchema(constraints.patternProperties[keys[i]], fullschema.fullschema);
                    }
                }
                if (constraints.additionalProperties !== undefined) {
                    if (constraints.additionalProperties === false)
                        this.additionalProperties = false
                    else
                        this.additionalProperties = new PseudoSchema(constraints.additionalProperties, fullschema.fullschema);
                }
                if (constraints.propertyNames !== undefined) {
                    fullschema.replaceRef(constraints.propertyNames);
                    this.propertyNames = new Constraints("string", constraints.propertyNames, fullschema);
                }
                break;
            // no default
        }
        this.constraints = [];
        if (this.enum !== undefined)
            this.constraints.push(val => {
                if (this.enum.indexOf(val) === -1)
                    return "Must be one of the choices.";
            });
        if (type === "integer") type = "number";
        const c = constraintTypes[type];
        const k = Object.keys(c);
        for (let i = 0; i < k.length; i++)
            if (constraints[k[i]] !== undefined)
                this.constraints.push(c[k[i]](constraints[k[i]]));
    }

    validate(val) {
        for (let i = 0; i < this.constraints.length; i++) {
            let ret = this.constraints[i](val);
            if (ret !== undefined) {
                return ret;
            }
        }
    }
}

class Editor {
    constructor(schema, fullschema) {
        this.title = schema.title || schema.type;
        this.type = schema.type;
        this.description = schema.description;
        this.constraints = new Constraints(schema.type, schema, fullschema)
    }
    component() {
        return editorTypes[this.type];
    }
    idForValue(value) {
        return 0;
    }
}

class MultiEditor {
    constructor(editors) {
        this.editors = editors;
    }

    component() {
        return this.editors;
    }
    idForValue(value) {
        if (value === undefined)
            return 0;
        let match = [];
        let mightmatch = [];
        for (let i = 0; i < this.editors.length; i++) {
            const constraints = this.editors[i].constraints
            let ok = false;
            switch (constraints.type) {
                case "null":
                    if (value === null)
                        ok = true;
                    break;
                case "boolean":
                    if (typeof value === "boolean")
                        ok = true;
                    break;
                case "integer":
                    if (Number.isInteger(value))
                        ok = true;
                    break;
                case "number":
                    if (typeof value === "number")
                        ok = true;
                    break;
                case "string":
                    if (typeof value === "string")
                        ok = true;
                    break;
                case "array":
                    if (Array.isArray(value))
                        ok = true;
                    break;
                case "object":
                    if (value instanceof Object && value.constructor === Object)
                        ok = true;
                    break;
                // no default
            }
            if (ok) {
                //first check const/enum which would be direct match
                if (constraints.const !== undefined) {
                    if (value === constraints.const)
                        return i;
                    else {
                        mightmatch.push(i);
                        continue
                    }
                }
                if (constraints.enum !== undefined) {
                    if (constraints.enum.indexOf(value) !== -1)
                        return i;
                    else {
                        mightmatch.push(i);
                        continue
                    }
                }
                if (constraints.validate(value) === undefined)
                    match.push(i);
                else
                    mightmatch.push(i);
            }
        }
        // we didn't find enum/const match, so consider everything that validates
        if (match.length !== 0)
            return match[0];
        // nothing validated - guess based on type
        if (mightmatch.length !== 0)
            return mightmatch[0];
        return 0;
    }
}

const constraintTypes = {
    "null": {},
    "boolean": {},
    "number": {
        "multipleOf": constraint => {
            if (!Array.isArray(constraint))
                constraint = [constraint];
            return val => {
                for (let i = 0; i < constraint.length; i++) {
                    if (val % constraint[i] !== 0)
                        return "Must be a multiple of " + constraint[i];
                }
            }
        },
        "maximum": constraint => {
            return val => {
                if (val > constraint)
                    return "Must be less than or exactly " + constraint;
            }
        },
        "exclusiveMaximum": constraint => {
            return val => {
                if (val >= constraint)
                    return "Must be less than " + constraint;
            }
        },
        "minimum": constraint => {
            return val => {
                if (val < constraint)
                    return "Must be greater than or exactly " + constraint;
            }
        },
        "exclusiveMinimum": constraint => {
            return val => {
                if (val <= constraint)
                    return "Must be greater than " + constraint;
            }
        }
    },
    "string": {
        "maxLength": constraint => {
            return val => {
                if (val.length > constraint)
                    return "Length must be less than or equal to " + constraint;
            }
        },
        "minLength": constraint => {
            return val => {
                if (val.length < constraint)
                    return "Length must be greater than or equal to " + constraint;
            }
        },
        "pattern": constraint => {
            if (!Array.isArray(constraint))
                constraint = [constraint];
            return val => {
                for (let i = 0; i < constraint.length; i++) {
                    if (!RegExp(constraint[i]).test(val))
                        return "Must match pattern '" + constraint[i] + "'";
                }
            }
        },
        "format": constraint => {
            return val => {
                console.error("todo: format")
            }
        }
    },
    "array": {
        "maxItems": constraint => {
            return val => {
                if (val.length > constraint)
                    return "Must have less than or equal to " + constraint + " items";
            }
        },
        "minItems": constraint => {
            return val => {
                if (val.length < constraint)
                    return "Must have more than or equal to " + constraint + " items";
            }
        },
        "uniqueItems": constraint => {
            return val => {
                console.error("todo: unique items");
            }
        },
        "contains": constraint => {
            return val => {
                console.error("todo: contains");
            }
        },
    },
    "object": {
        "maxProperties": constraint => {
            return val => {
                if (Object.keys(val).length > constraint)
                    return "Must have less than or equal to " + constraint + " items";
            }
        },
        "minProperties": constraint => {
            return val => {
                if (Object.keys(val).length < constraint)
                    return "Must have more than or equal to " + constraint + " items";
            }
        },
        "dependencies": constraint => {
            return val => {
                console.error("todo: dependencies");
            }
        }
    }
}

class AlwaysFalse {
}

function resolveSubset(a, b) {
    if (!Array.isArray(a))
        a = [a];
    if (!Array.isArray(b))
        b = [b];
    let ret = a.filter(val => b.indexOf(val) >= 0);
    if (ret.length === 0)
        throw new AlwaysFalse();
    return ret;
}

function resolveConcat(a, b) {
    return [].concat(a, b)
}

function resolveNo() {
    throw new AlwaysFalse();
}

function resolveItems(a, b, fullschema) {
    if (Array.isArray(a)) {
        if (Array.isArray(b)) {
            if (a.length !== b.length) {
                throw new AlwaysFalse();
            }
            let ret = [];
            for (let i = 0; i < a.length; i++) {
                ret[i] = resolveSchema(a[i], b[i], fullschema);
            }
            return ret;
        }
        let ret = [];
        for (let i = 0; i < a.length; i++) {
            ret[i] = resolveSchema(a[i], b, fullschema);
        }
        return ret;
    }
    if (Array.isArray(b)) {
        let ret = [];
        for (let i = 0; i < b.length; i++) {
            ret[i] = resolveSchema(a, b[i], fullschema);
        }
        return ret;
    }
    return resolveSchema(a, b, fullschema);
}

function resolveProperties(a, b, fullschema) {
    let ret = Object.assign({}, a, b)
    let equalkeys = Object.keys(a || {})
    equalkeys = Object.keys(b || {}).filter(val => equalkeys.indexOf(val) >= 0)
    // handle additionalProperties for non-equal keys
    for (let equal of equalkeys) {
        ret[equal] = resolveSchema(a[equal], b[equal], fullschema)
    }
    return ret;
}

function resolveB(a, b) {
    return b;
}

const resolveConstraint = {
    //general
    "type": resolveSubset,
    "enum": resolveSubset,
    "const": resolveNo,
    "format": resolveNo,
    "title": resolveB,
    "allOf": resolveConcat,
    "anyOf": resolveSubset,
    "oneOf": resolveSubset,
    "description": resolveB,
    //null
    //boolean
    //number
    "multipleOf": resolveConcat,
    "maximum": Math.min,
    "exclusiveMaximum": Math.min,
    "minimum": Math.max,
    "exclusiveMinimum": Math.max,
    //string
    "maxLength": Math.min,
    "minLength": Math.max,
    "pattern": resolveConcat,
    //array
    "items": resolveItems,
    "additionalItems": resolveSchema,
    "maxItems": Math.min,
    "minItems": Math.max,
    "uniqueItems": resolveNo,
    "contains": resolveSchema,
    //object
    "maxProperties": Math.min,
    "minProperties": Math.max,
    "required": resolveSubset,
    "properties": resolveProperties,
    "patternProperties": resolveProperties,
    "additionalProperties": resolveSchema,
    //dependencies
    "propertyNames": resolveSchema,

    //custom
    "propertyOrder": resolveB,
};

const knownConstraints = Object.keys(resolveConstraint);


// go through every key and call resolve function in case both are there;
// otherwise use one or the other
function resolveSchema(a, b, fullschema) {
    let ret = {};
    fullschema.replaceRef(a);
    fullschema.replaceRef(b);
    try {
        for (let constraint of knownConstraints) {
            let x = a[constraint];
            let y = b[constraint]
            if (x !== undefined) {
                if (y !== undefined) {
                    if (x === y) {
                        ret[constraint] = x;
                    } else if (JSON.stringify(x) === JSON.stringify(y)) {
                        ret[constraint] = x;
                    } else {
                        ret[constraint] = resolveConstraint[constraint](x, y, fullschema);
                    }
                } else {
                    ret[constraint] = x;
                }
            } else if (y !== undefined) {
                ret[constraint] = y;
            }
        }
    } catch (e) {
        if (e instanceof AlwaysFalse) {
            return false;
        } else {
            throw e;
        }
    }
    return ret;
}

class PseudoSchema {
    constructor(schema, fullschema) {
        this.schema = schema;
        this.title = schema.title;
        this.fullschema = fullschema;
        if (fullschema === undefined) {
            this.fullschema = schema;
        }
        this.propertyOrder = schema.propertyOrder;
    }

    resolveRef(ref) {
        let refs = ref.split('/')
        if (refs[0] !== '#') {
            console.error("Only internal refs implemented.");
            return {};
        }
        let part = this.fullschema;
        for (let i = 1, l = refs.length; i < l; i++) {
            part = part[refs[i]]
            if (part === undefined) {
                console.error("Couldn't find ref '" + ref + "' in schema.");
                return {};
            }
        }
        return part;
    }

    replaceRef(part) {
        if (part["$ref"] !== undefined) {
            Object.assign(part, this.resolveRef(part["$ref"]))
            delete part["$ref"]
        }
    }

    flatten(part, main) {
        let tmp = Object.assign({}, part);
        if (main === true)
            delete tmp.title;
        this.replaceRef(tmp);

        if (part.allOf !== undefined) {
            let allOf = part.allOf;
            delete part.allOf;
            for (let subpart of allOf) {
                tmp = resolveSchema(tmp, this.flatten(subpart), this);
                if (tmp === false) {
                    return false;
                }
            }
        }

        let oneanyOf = (tmp.oneOf || []).concat(tmp.anyOf || []);
        if (oneanyOf.length === 0)
            return tmp;

        delete tmp.oneOf;
        delete tmp.anyOf;

        let ret = [];

        for (let variant of oneanyOf) {
            variant = this.flatten(variant);
            if (!Array.isArray(variant))
                ret.push(resolveSchema(tmp, variant, this));
            else
                for (let subvariant of variant)
                    ret.push(resolveSchema(tmp, subvariant, this));
        }

        ret = ret.filter(val => val !== false);

        return ret
    }

    getEditor() {
        let tmp = this.flatten(this.schema, true);

        if (tmp === false)
            throw "Schema can't be fulfilled";

        if (!Array.isArray(tmp)) {
            if (!Array.isArray(tmp.type)) {
                return new Editor(tmp, this);
            } else {
                if (tmp.type.length === 1) {
                    tmp.type = tmp.type[0];
                    return new Editor(tmp, this)
                }
                let ret = [];
                for (let i = 0; i < tmp.type.length; i++) {
                    let ed = Object.assign({}, tmp)
                    ed.type = tmp.type[i];
                    ed.title = tmp.type[i];
                    delete ed.description;
                    ret.push(new Editor(ed, this));
                }
                return new MultiEditor(ret);
            }
        }
        let ret = [];
        for (let part of tmp) {
            if (Array.isArray(part.type)) {
                for (let tmp of part.type) {
                    let title = part.title;
                    if (title === undefined) {
                        title = tmp;
                    } else {
                        title += " - " + tmp;
                    }
                    ret.push(new Editor(Object.assign(part, { type: tmp, title: title }), this))
                }
            } else {
                ret.push(new Editor(part, this));
            }
        }
        return new MultiEditor(ret);
    }
}

function processSchema(schema) {
    return new PseudoSchema(schema);
}

export default processSchema;
