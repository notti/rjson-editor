import ObjectEditor from './editors/Object.js';
import InputEditor from './editors/Input.js';


const editorTypes = {
    "object": ObjectEditor,
    "string": InputEditor
}

class Constraints {
    constructor(type, constraints, fullschema) {
        this.const = constraints.const
        this.enum = constraints.enum
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
                    this.additionalProperties = new PseudoSchema(constraints.additionalProperties, fullschema.fullschema);
                }
                if (constraints.propertyNames !== undefined) {
                    fullschema.replaceRef(constraints.propertyNames);
                    this.propertyNames = new Constraints("string", constraints.propertyNames, fullschema);
                }
                break;
            // no default
        }
        this.constraints = []
        if(type === "integer") type = "number";
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
}

class MultiEditor {
    constructor(schema, editors, fullschema) {
        this.title = schema.title || schema.type;
        this.description = schema.description;
        this.editors = editors;
    }

    component() {
        return this.editors;
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

function mergeTypeConstraints(a, b) {
    let ret = mergeConstraints(a, b);
    if (a.type !== undefined) {
        let alist = [].concat(a.type);
        if (b.type !== undefined) {
            let tmp = [].concat(b.type).filter(val => alist.indexOf(val) >= 0);
            if (tmp.length === 0) {
                console.error("unsatisfiable schema; can't match types '" + a.type + "' and '" + b.type + "'")
                ret.type = a.type;
            } else if (tmp.length > 1) {
                ret.type = tmp;
            } else {
                ret.type = tmp[0];
            }
        } else {
            ret.type = a.type;
        }
    } else {
        if (b.type === undefined) {
            console.error("need at least a type!")
        } else {
            ret.type = b.type;
        }
    }
    if (a.title !== undefined) {
        ret.title = a.title;
    }
    if (b.title !== undefined) {
        ret.title = b.title;
    }
    if (a.description !== undefined) {
        ret.description = a.description;
    }
    if (b.description !== undefined) {
        ret.description = b.description;
    }
    return ret
}

const mustBeSchema = [
    "additionalItems",
    "additionalProperties",
    "contains"
]

const minMerge = [
    "exclusiveMaximum",
    "maximum",
    "maxItems",
    "maxLength",
    "maxProperties"
]

const maxMerge = [
    "exclusiveMinimum",
    "minimum",
    "minItems",
    "minLength",
    "minProperties"
]

function mergeConstraints(a, b) {
    let ret = {};
    for (let i = i; i < mustBeSchema.length; i++) {
        if (a[mustBeSchema[i]] !== undefined && b[mustBeSchema[i]] !== undefined) {
            ret[mustBeSchema[i]] = mergeTypeConstraints(a, b)
        } else if (a[mustBeSchema[i]] !== undefined || b[mustBeSchema[i]] !== undefined) {
            ret[mustBeSchema[i]] = a[mustBeSchema[i]] || b[mustBeSchema[i]];
        }
    }
    if (a.const !== undefined && b.const !== undefined) {
        if (a.const !== b.const) {
            console.error("can't merge schemas; non equal consts")
        }
        ret.const = a.const;
    } else if (a.const !== undefined || b.const !== undefined) {
        ret.const = a.const || b.const;
    }
    if (a.dependencies !== undefined || b.dependencies !== undefined) {
        ret.dependencies = Object.assign({}, b.dependencies, a.dependencies)
        let equalkeys = Object.keys(a || {})
        equalkeys = Object.keys(b || {}).filter(val => equalkeys.indexOf(val) >= 0)
        for (let i = 0; i < equalkeys.length; i++) {
            if (Array.isArray(a.dependencies[equalkeys[i]])) {
                if (Array.isArray(b.dependencies[equalkeys[i]])) {
                    ret.dependencies[equalkeys[i]] = a.dependencies[equalkeys[i]].concat(b.dependencies[equalkeys[i]])
                } else {
                    console.error("Can only merge dependencies of same type")
                    ret.dependencies[equalkeys[i]] = a.dependencies[equalkeys[i]];
                }
            } else {
                if (Array.isArray(b.dependencies[equalkeys[i]])) {
                    console.error("Can only merge dependencies of same type")
                    ret.dependencies[equalkeys[i]] = a.dependencies[equalkeys[i]];
                } else {
                    ret.dependencies[equalkeys[i]] = mergeTypeConstraints(a.dependencies[equalkeys[i]], b.dependencies[equalkeys[i]])
                }
            }
        }
    }
    if (a.enum !== undefined && b.enum !== undefined) {
        ret.enum = b.enum.filter(val => a.enum.indexOf(val) >= 0)
    } else if (a.enum !== undefined || b.enum !== undefined) {
        ret.enum = a.enum || b.enum;
    }
    for (let i = i; i < minMerge.length; i++) {
        if (a[minMerge[i]] !== undefined && b[minMerge[i]] !== undefined) {
            ret[minMerge[i]] = Math.min(a[minMerge[i]], b[minMerge[i]]);
        } else if (a[minMerge[i]] !== undefined || b[minMerge[i]] !== undefined) {
            ret[minMerge[i]] = a[minMerge[i]] || b[minMerge[i]];
        }
    }
    for (let i = i; i < maxMerge.length; i++) {
        if (a[maxMerge[i]] !== undefined && b[maxMerge[i]] !== undefined) {
            ret[maxMerge[i]] = Math.max(a[maxMerge[i]], b[maxMerge[i]]);
        } else if (a[maxMerge[i]] !== undefined || b[maxMerge[i]] !== undefined) {
            ret[maxMerge[i]] = a[maxMerge[i]] || b[maxMerge[i]];
        }
    }
    if (a.format !== undefined && b.format !== undefined) {
        if (a.format !== b.format) {
            console.error("mismatching format during merge!")
        }
        ret.format = a.format;
    } else if (a.format !== undefined || b.format !== undefined) {
        ret.format = a.format || b.format;
    }
    if (a.items !== undefined && b.items !== undefined) {
        if (Array.isArray(a.items)) {
            ret.items = [];
            if (Array.isArray(b.items)) {
                if (a.items.length !== b.items.length) {
                    console.error("items must be same length!")
                    ret.items = a.items;
                } else {
                    for (let i = 0; i < a.items.length; i++) {
                        ret.items[i] = mergeTypeConstraints(a.items[i], b.items[i]);
                    }
                }
            } else {
                for (let i = 0; i < a.items.length; i++) {
                    ret.items[i] = mergeTypeConstraints(a.items[i], b.items);
                }
            }
        } else {
            ret.items = [];
            if (Array.isArray(b.items)) {
                for (let i = 0; i < b.items.length; i++) {
                    ret.items[i] = mergeTypeConstraints(a.items, b.items[i]);
                }
            }
        }
    } else if (a.items !== undefined || b.items !== undefined) {
        ret.items = a.items || b.items;
    }
    if (a.multipleOf !== undefined && b.multipleOf !== undefined) {
        ret.multipleOf = [].concat(a.multipleOf, b.multipleOf);
    } else if (a.multipleOf !== undefined || b.multipleOf !== undefined) {
        ret.multipleOf = a.multipleOf || b.multipleOf;
    }
    if (a.pattern !== undefined || b.pattern !== undefined) {
        ret.pattern = [].concat(a.pattern || [], b.pattern || []);
    }
    if (a.patternProperties !== undefined || b.patternProperties !== undefined) {
        ret.patternProperties = Object.assign({}, b.patternProperties, a.patternProperties)
        let equalkeys = Object.keys(a || {})
        equalkeys = Object.keys(b || {}).filter(val => equalkeys.indexOf(val) >= 0)
        for (let i = 0; i < equalkeys.length; i++) {
            ret.patternProperties[equalkeys[i]] = mergeTypeConstraints(a.patternProperties[equalkeys[i]], b.patternProperties[equalkeys[i]])
        }
    }
    if (a.properties !== undefined || b.properties !== undefined) {
        ret.properties = Object.assign({}, b.properties, a.properties)
        let equalkeys = Object.keys(a || {})
        equalkeys = Object.keys(b || {}).filter(val => equalkeys.indexOf(val) >= 0)
        for (let i = 0; i < equalkeys.length; i++) {
            ret.properties[equalkeys[i]] = mergeTypeConstraints(a.properties[equalkeys[i]], b.properties[equalkeys[i]])
        }
    }
    if (a.propertyNames !== undefined && b.propertyNames !== undefined) {
        ret.propertyNames = mergeConstraints(a, b)
    } else if (a.propertyNames !== undefined || b.propertyNames !== undefined) {
        ret.propertyNames = a.propertyNames || b.propertyNames;
    }
    if (a.required !== undefined && b.required !== undefined) {
        ret.required = b.required.filter(val => a.required.indexOf(val) >= 0)
    } else if (a.required !== undefined || b.required !== undefined) {
        ret.required = a.required || b.required;
    }
    if (a.uniqueItems !== undefined && b.uniqueItems !== undefined) {
        if (a.uniqueItems !== b.uniqueItems)
            console.error("Can't merge uniqueItems")
        ret.uniqueItems = a.uniqueItems;
    } else if (a.uniqueItems !== undefined) {
        ret.uniqueItems = a.uniqueItems;
    } else if (b.uniqueItems !== undefined) {
        ret.uniqueItems = b.uniqueItems;
    }
    if (b.propertyOrder !== undefined)
        ret.propertyOrder = b.propertyOrder;
    if (a.propertyOrder !== undefined)
        ret.propertyOrder = a.propertyOrder;
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
        this.editor = null
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

    getEditor() {
        this.replaceRef(this.schema)

        let tmp = Object.assign({}, this.schema);
        if (this.schema.allOf !== undefined) {
            for (let i = 0; i < this.schema.allOf.length; i++) {
                this.replaceRef(this.schema.allOf[i])
                tmp = mergeTypeConstraints(tmp, this.schema.allOf[i])
            }
        }
        delete tmp.title;
        delete tmp.description;
        if (this.schema.title !== undefined) {
            tmp.title = this.schema.title;
        }
        if (this.schema.description !== undefined) {
            tmp.description = this.schema.description;
        }
        let oneanyOf = (this.schema.oneOf || []).concat(this.schema.anyOf || []);
        if (oneanyOf.length === 0) {
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
                    delete ed.title;
                    delete ed.description;
                    ret.push(new Editor(ed, this));
                }
                return new MultiEditor(tmp, ret, this);
            }
        }
        let ret = [];
        for (let i = 0; i < oneanyOf.length; i++) {
            this.replaceRef(oneanyOf[i]);
            let ed = mergeTypeConstraints(tmp, oneanyOf[i]);
            if (Array.isArray(ed.type)) {
                console.error("Can't nest multieditors")
                ed.type = ed.type[0];
            }
            ret.push(new Editor(ed, this));
        }
        return new MultiEditor(tmp, ret, this);
    }
}

function processSchema(schema) {
    return new PseudoSchema(schema);
}

export default processSchema;