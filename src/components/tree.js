import Handler from "../factory/handler";
import Render from "../factory/render";
import {toArray} from "../core/util";
import {creatorTypeFactory} from "../factory/creator";

const name = 'tree';

export function parseRule(rule) {
    let props = rule.props;
    if (props.data === undefined) props.data = [];
    if (props.type === undefined) props.type = 'checked';
    if (props.multiple === undefined) props.multiple = false;
    if (isMultiple(rule) && Array.isArray(rule.value))
        rule.value = this.rule.value[0] || '';
    rule.value = toArray(rule.value);

    return rule
}

export function isMultiple(rule) {
    return (!rule.props.multiple) && rule.props.type === 'selected'
}

class handler extends Handler {
    init() {
        parseRule(this.rule);

        this._data = {};
        this.data(this.rule.props.data);

        this._parseValue();

    }

    _parseValue() {
        this.rule.value.forEach(this.rule.props.type === 'selected' ? (v) => this.selected(v) : (v) => this.checked(v));
        let value = [], props = this.rule.props;
        props.type === 'selected'
            ? Object.keys(this._data).forEach((key) => {
                let node = this._data[key];
                if (node.selected === true)
                    value.push(node.id);
            })
            : Object.keys(this._data).forEach((key) => {
                let node = this._data[key];
                if (node.checked === true)
                    value.push(node.id);
            });

        this.rule.value = value;
    }

    toParseValue(value) {
        value = toArray(value);
        this.choose(value);
        this.parseValue = value;
        return value;
    }

    choose(value) {
        let {rule, _data} = this;
        rule.props.type === 'selected'
            ? Object.keys(_data).forEach((key) => {
                this.vm.$set(_data[key], 'selected', value.indexOf(_data[key].id) !== -1);
            })
            : Object.keys(_data).forEach((key) => {
                this.vm.$set(_data[key], 'checked', value.indexOf(_data[key].id) !== -1);
            });
    }

    checked(v) {
        if (this._data[v] !== undefined) {
            this.vm.$set(this._data[v], 'checked', true);
        }
    }

    selected(v) {
        if (this._data[v] !== undefined) {
            this.vm.$set(this._data[v], 'selected', true);
        }
    }

    toTrueValue(parseValue) {
        let value = parseValue;
        return !isMultiple(this.rule) ? value : (value[0] || '');
    }

    watchParseValue(n) {
        this.choose(n);
    }

    selectedNodeToValue(nodes) {
        let value = [];
        nodes.forEach((node) => {
            if (node.selected === true)
                value.push(node.id);
        });
        return value;
    }

    checkedNodeToValue(nodes) {
        let value = [];
        nodes.forEach((node) => {
            if (node.checked === true)
                value.push(node.id);
        });
        return value;
    }

    toValue() {
        return this.rule.props.type === 'selected'
            ? this.selectedNodeToValue(this.el.getSelectedNodes())
            : this.checkedNodeToValue(this.el.getCheckedNodes())
    }

    data(data) {
        data.forEach((node) => {
            this._data[node.id] = node;
            if (node.children !== undefined && Array.isArray(node.children))
                this.data(node.children)
        });
    }
}

const event = {
    s: 'on-select-change',
    c: 'on-check-change'
};

class render extends Render {
    parse() {
        let {rule, refName, field, unique} = this.handler, props = this.vData.on(rule.event).on({
            [event.s]: (v) => {
                this.vm.changeFormData(field, this.handler.toValue());
                rule.event[event.s] && rule.event[event.s](v);
            },
            [event.c]: (v) => {
                this.vm.changeFormData(field, this.handler.toValue());
                rule.event[event.c] && rule.event[event.c](v);
            },
        }).props(rule.props).ref(refName).key(`fip${unique}`).get();

        let inputProps = this.inputProps().props({
            type: "text",
            value: this.handler.parseValue.toString(),
            disable: true
        }).key('fipit' + unique).style({display: 'none'}).ref(`${refName}it`).get();
        return [this.vNode.tree(props), this.vNode.input(inputProps)];
    }
}

const types = {'treeSelected': 'selected', 'treeChecked': 'checked'};

const maker = Object.keys(types).reduce((initial, key) => {
    initial[key] = creatorTypeFactory(name, types[key]);
    return initial;
}, {});

export default {handler, render, name, maker};
