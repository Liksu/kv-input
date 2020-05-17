const template = `
    <style>
        :host {
            display: grid;
            grid-template-columns: auto auto;
            font-family: sans-serif;
        }
        
        input {
            font-size: inherit;
            display: inline-block;
            border: 1px solid silver;
            margin-left: -1px;
            margin-top: -1px;
            padding: 4px;
        }
        
        input[type="checkbox"] {
            margin: 5px;
        }
        
        input:focus, select:focus {
            outline: none;
        }
        
        .invalid {
            color: red;
        }
        
        select {
            min-height: 2em;
            margin-left: -1px;
            margin-top: -1px;
            padding: 4px;
        }
        
        h3 {
            grid-column: span 2;
        }
        
        span {
            margin-bottom: 4px;
        }
        
        .key-title {
            padding-right: 4px;
        }
    </style>
    
    <h3 id="title" class="title main-title"></h3>
    <span id="key-title" class="title column-title key-title"></span>
    <span id="value-title" class="title column-title value-title"></span>
`;
const empty = {
    valueOf: () => Symbol.for(null),
    toString: () => ''
};

class KVInput extends HTMLElement {
    _debounce = 300;
    _index = 0;
    _model = { // [unique index]: {key: {content, input}, value: {content, input}, isLast}
        *[Symbol.iterator]() {
            const order = Object.keys(this).sort((a, b) => a - b);
            while (order.length) yield this[order.shift()];
        }
    };
    _lastIndex = 0;
    _timerId = null;
    _uiCache = {};
    _useTypes = true;
    _duplicateIndexStep = 0.00001;
    _meta = {};
    _template = template;
    _keys = null;

    constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.initRender();

        this.shadowRoot.addEventListener('change', e => this.update(e));
        this.shadowRoot.addEventListener('keyup', e => this.keyupHandler(e));

        const json = this.processInnerHTML();

        this.kv = json || {};
    }

    processInnerHTML() {
        if (!this.innerHTML) return;

        let json;

        try {
            // try to find json just inside of the tag
            json = JSON.parse(this.innerHTML);
        } catch (e) {
            // maybe there is some DOM inside of the tag

            const slots = Object.fromEntries(Array.from(
                this.querySelectorAll('[slot], style'),
                slot => [
                    slot.tagName === 'STYLE' ? 'style' : slot.getAttribute('slot'),
                    slot.innerHTML.trim()
                ]
            ));
            this.querySelectorAll('style').forEach(slot => slot.remove());

            if (slots.style) {
                this._template += `<style>${slots.style}</style>`;
            }

            if (slots.json) {
                try { json = JSON.parse(slots.json) } catch (e) {}
            }

            if (slots.meta) {
                try { this._meta = JSON.parse(slots.meta) } catch (e) {}
            }

            if (slots.keys) {
                try {
                    this._keys = JSON.parse(slots.meta);
                } catch (e) {
                    this._keys = null;
                }
            }
        }

        return json;
    }

    restoreValueType(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value == null || value == empty) return null;
        if (!isNaN(parseFloat(value)) && isFinite(value)) return parseFloat(value); //possible incorrect for strings with number in the beginning
        return value;
    }

    restoreTypes(obj) {
        if (!obj || typeof obj !== 'object') return;
        Object.entries(obj).forEach(([key, value]) => {
            obj[key] = this.restoreValueType(value);
        });
    }

    getModelArray() {
        const modelArray = Array.from(this._model);
        if (this._model[this._lastIndex].isLast) modelArray.splice(-1);
        return modelArray;
    }

    get kv() {
        const entries = this.getModelArray()
            .map(pair => [
                pair.key.content,
                this._useTypes
                    ? this.restoreValueType(pair.value.content)
                    : pair.value.content
            ]);

        return Object.fromEntries(entries);
    }

    set kv(obj) {
        if (typeof obj !== 'object') return;
        this.restoreTypes(obj);
        if (this._index) this.clearModel();
        this.initRender();
        Object.entries(obj || {}).forEach(pair => this.createPair(...pair));
        this.createPair('', '', 'last'); // add new pair line
        this.update();
    }

    get meta() {
        return this._meta;
    }

    set meta(metaData) {
        if (!metaData) this._meta = {};
        else if (typeof metaData === 'object') Object.assign(this._meta, metaData);

        this.reset();
    }

    get keys() {
        return this._keys;
    }

    set keys(keysList) {
        if (Array.isArray(keysList)) this._keys = keysList;
        else if (typeof keysList === 'string') {
            try {
                this._keys = JSON.parse(keysList)
            } catch (e) {
                this._keys = keysList.split(/\s*,\s*/);
            }
        }
        else this._keys = null;

        this.reset();
    }

    getOrder(pairIndex = null) {
        const order = Object.keys(this._model).sort((a, b) => a - b);
        const first = order[0];
        const last = order[order.length - 1];
        let isFirst = null;
        let isLast = null;
        let prev = null;
        let next = null;

        if (pairIndex) {
            isFirst = pairIndex === first;
            isLast = pairIndex === last;
            const index = order.findIndex(index => index === pairIndex);
            if (!isFirst) prev = this._model[order[index - 1]];
            if (!isLast) next = this._model[order[index + 1]];
        }

        return {
            order,
            first,
            last,
            isFirst,
            isLast,
            prev,
            next
        };
    }

    keyupHandler(event) {
        const input = event.path[0];
        const inputName = input.dataset.name;
        const {isFirst, isLast, prev, next} = this.getOrder(input.dataset.index);

        if (event.key === 'ArrowUp' && !isFirst && prev) {
            const prevInput = prev[inputName].input;
            prevInput.focus();
            if (prevInput.type !== 'checkbox' && prevInput.tagName !== 'SELECT') {
                prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
            }
        } else if (event.key === 'ArrowDown' && !isLast && next) {
            const nextInput = next[inputName].input;
            nextInput.focus();
            if (nextInput.type !== 'checkbox' && nextInput.tagName !== 'SELECT') {
                nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
            }
        } else if (event.key === 'd' && event.altKey && event.ctrlKey) {
            const {key: {content: key}, value: {content: value}} = input.pairLink || this._model[input.dataset.index];
            const newIndex = +input.dataset.index + this._duplicateIndexStep;
            this.createPair(key, value, false, newIndex);
            this.reSort();
            this.validateKeys();
            this._model[newIndex].key.input.focus();
        } else if (event.key === 'y' && event.ctrlKey) {
            this.removePair(input.dataset.index);
            if (isFirst && next) next[inputName].input.focus();
            else if (prev) prev[inputName].input.focus();
        } else {
            this.debounceUpdate(event);
        }

        event.preventDefault();
    }

    validateKeys() {
        const uniqueKeys = {};
        this.getModelArray().forEach(({key}) => {
            if (uniqueKeys[key.content]) {
                uniqueKeys[key.content].classList.add('invalid');
                key.input.classList.add('invalid');
            } else {
                uniqueKeys[key.content] = key.input;
                key.input.classList.remove('invalid');
            }
        });
    }

    debounceUpdate(event) {
        if (this._timerId) clearTimeout(this._timerId);
        if (!this._debounce) return this.update(event);
        this._timerId = setTimeout(() => this.update(event), this._debounce);
    }

    setElementTail(element, name, pairLink, index) {
        element.pairLink = pairLink;
        element.dataset.name = name;
        element.dataset.index = index;
        element.classList.add(name, 'input');
    }

    createElement(index, name, value, pairLink) {
        let element;
        const allowed = this._useTypes && name !== 'key';

        const keyContent = this._meta[pairLink.key.content];
        const keyArray = Array.isArray(keyContent);
        const valueArray = Array.isArray(value);

        if (name === 'key' && this._keys && Array.isArray(this._keys)) {
            element = this.createSelect(this._keys, false);
            element.value = this._keys.includes(value) ? value : '';
        } else if (allowed && typeof value === 'boolean') {
            element = this.createCheckbox(value);
        } else if (allowed && (valueArray || keyArray)) {
            if (!keyContent) this._meta[pairLink.key.content] = value;
            element = this.createSelect(keyArray ? keyContent : value);
            element.value = valueArray ? '' : value;
        } else {
            element = this.createInput(value);
        }

        this.setElementTail(element, name, pairLink, index);
        element.title = value;

        return element;
    }

    createInput(value) {
        const input = document.createElement('input');
        input.value = value;
        input.type = 'text';
        return input;
    }

    createSelect(value, canSwitch = true) {
        const select = document.createElement('select');

        [empty, ...value].forEach(item => {
            const option = document.createElement('option');
            option.value = option.innerText = item;
            select.appendChild(option);
        });
        select.value = null;

        if (canSwitch) {
            const unwrapSelect = (event) => {
                if (!event.ctrlKey) return;

                const input = this.createInput(select.value);
                this.setElementTail(input, 'value', select.pairLink, select.dataset.index);

                select.pairLink.value.input = input;
                select.parentNode.insertBefore(input, select);
                select.removeEventListener('click', unwrapSelect);
                delete select.unwrap;
                select.remove();
            };
            select.addEventListener('click', unwrapSelect);
            select.unwrap = unwrapSelect;
        }

        return select;
    }

    createCheckbox(value) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = value;

        const unwrapCheckbox = (event) => {
            if (!event.ctrlKey) return;

            input.type = 'text';
            input.value = String(input.checked);
            input.removeEventListener('click', unwrapCheckbox);
        };
        input.addEventListener('click', unwrapCheckbox);
        return input;
    }

    createPair(key, value, isLast = false, index = this._index++) {
        const link = this._model[index] = { index, isLast, key: {content: key} };

        Object.assign(link, {
            key: {
                content: key,
                input: this.createElement(index, 'key', key, link)
            },
            value: {
                content: Array.isArray(value) ? empty : value,
                input: this.createElement(index, 'value', value, link)
            }
        });

        this.shadowRoot.appendChild(link.key.input);
        this.shadowRoot.appendChild(link.value.input);

        if (isLast) this._lastIndex = index;

        return index;
    }

    update(event) {
        if (event) this.updateUI(event);

        // fire onchange
        if (this.onchange && this.onchange instanceof Function) this.onchange(this.kv);

        this.validateKeys();
    }

    updateUI(event) {
        const input = event.path[0];
        const pairIndex = input.dataset.index;
        const pairLink = input.pairLink || this._model[pairIndex];
        const inputLink = pairLink[input.dataset.name];

        const inputValue = input.type === 'checkbox' ? input.checked : input.value;
        if (inputLink.content === inputValue) return;

        inputLink.content = inputValue;
        inputLink.input.title = inputValue;

        // set null for empty option in dropdown
        if (this._useTypes && input.tagName === 'SELECT' && !input.selectedIndex) {
            inputLink.content = empty;
        }

        // update field to select if key equal to known meta
        const keyContent = this._meta[pairLink.key.content];
        if (this._useTypes && keyContent && Array.isArray(keyContent)) {
            const valueInput = pairLink.value.input;
            const select = this.createSelect(keyContent);
            select.value = pairLink.value.content;
            this.setElementTail(select, valueInput.dataset.name, pairLink, pairIndex);
            valueInput.parentNode.insertBefore(select, valueInput);
            pairLink.value.input = select;
            valueInput.remove();
        } else if (this._useTypes && !keyContent && pairLink.value.input.tagName === 'SELECT') {
            pairLink.value.input.unwrap({ctrlKey: true});
        }

        // add or remove pair
        let needToAdd = false;
        if ((!pairLink.key.content || pairLink.key.content == empty) && (!pairLink.value.content || pairLink.value.content == empty)) {
            needToAdd = this._keys && Object.keys(this._model).length === this._keys.length && !this._model[this._lastIndex].isLast;
            this.removePair(pairIndex);
        } else if (pairLink.isLast) {
            pairLink.isLast = false;
            needToAdd = !this._keys || Object.keys(this._model).length < this._keys.length;
        }

        if (needToAdd) {
            this._lastIndex = this.createPair('', '', 'last');
        }
    }

    clearModel() {
        this._model[this._lastIndex].isLast = false;
        Object.keys(this._model).forEach(pairIndex => {
            this.removePair(pairIndex);
        });
    }

    removePair(pairIndex) {
        const link = this._model[pairIndex];
        if (!link) return;
        if (link.isLast) return;

        link.key.input.remove();
        link.value.input.remove();
        delete this._model[pairIndex];

        const last = this._model[this._lastIndex];
        if (last) last.key.input.focus();
    }

    initRender() {
        this.shadowRoot.innerHTML = this._template;

        this._uiCache = {
            title: this.shadowRoot.getElementById('title'),
            keyTitle: this.shadowRoot.getElementById('key-title'),
            valueTitle: this.shadowRoot.getElementById('value-title')
        };

        this.updateTitles();
    }

    updateTitles() {
        const title = this.title || this.getAttribute('title') || '';
        const keyTitle = this.keyTitle || this['key-title'] || this.getAttribute('key-title') || '';
        const valueTitle = this.valueTitle || this['value-title'] || this.getAttribute('value-title') || '';

        if (title) {
            this._uiCache.title.innerHTML = title;
            this.toggleElement(this._uiCache.title, true);
        } else {
            this.toggleElement(this._uiCache.title, false);
        }

        if (keyTitle || valueTitle) {
            this._uiCache.keyTitle.innerHTML = keyTitle;
            this._uiCache.valueTitle.innerHTML = valueTitle;
            this.toggleElement(this._uiCache.keyTitle, true);
            this.toggleElement(this._uiCache.valueTitle, true);
        } else {
            this.toggleElement(this._uiCache.keyTitle, false);
            this.toggleElement(this._uiCache.valueTitle, false);
        }
    }

    reSort() {
        const {order} = this.getOrder();
        order.forEach(pairIndex => {
            const {key: {input: key}, value: {input: value}} = this._model[pairIndex];
            this.shadowRoot.appendChild(key);
            this.shadowRoot.appendChild(value);
        });
    }

    toggleElement(element, show) {
        element.style.display = show ? (element.tagName === 'SPAN' ? 'inline' : 'block') : 'none';
    }

    reset() {
        const currentModel = this.kv;
        this.initRender();
        this.kv = currentModel;
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        switch (attrName) {
            case 'meta':
                this.meta = JSON.parse(newVal);
                break;
            case 'keys':
                this.keys = newVal;
                break;
            case 'debounce':
                this._debounce = isNaN(parseInt(newVal)) ? 0 : parseInt(newVal);
                break;
            case 'use-types':
                this._useTypes = !!this.restoreValueType(newVal);
                this.reset();
                break;
            default:
                this.updateTitles();
        }
    }

    static get observedAttributes() {
        return ['title', 'key-title', 'value-title', 'debounce', 'use-types', 'meta', 'keys'];
    }
}

window.customElements.define('kv-input', KVInput);