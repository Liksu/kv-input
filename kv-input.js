const template = `
    <style>
        :host {
            display: grid;
            grid-template-columns: auto auto;
        }
        
        input {
            font-size: inherit;
            display: inline-block;
            border: 1px solid silver;
        }
        
        input {
            margin-left: -1px;
            margin-top: -1px;
            padding: 4px;
        }
        
        input[type="checkbox"] {
            margin: 5px;
        }
        
        input:focus {
            outline: none;
        }
        
        input.invalid {
            color: red;
        }
        
        h3 {
            grid-column: span 2;
        }
        
        span {
            margin-bottom: 4px;
        }
    </style>
    
    <h3 id="title"></h3>
    <span id="key-title"></span>
    <span id="value-title"></span>
`;

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

    static get observedAttributes() {
        return ['title', 'key-title', 'value-title', 'debounce', 'use-types'];
    }

    constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.initRender();

        let content;
        if (this.innerHTML) {
            try { content = JSON.parse(this.innerHTML) } catch (e) {}
        }

        this.kv = content || {};
    }

    restoreValueType(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(parseFloat(value))) return parseFloat(value);
        return value;
    }

    restoreTypes(obj) {
        Object.entries(obj).forEach(([key, value]) => {
            obj[key] = this.restoreValueType(value);
        });
    }

    get kv() {
        const entries = Array.from(this._model)
            .slice(0, -1)
            .map(pair => [pair.key.content, pair.value.content]);
        return Object.fromEntries(entries);
    }

    set kv(obj) {
        this.restoreTypes(obj);
        if (this._index) this.clearModel();
        this.initRender();
        Object.entries(obj).forEach(pair => this.createPair(...pair));
        this.createPair('', '', 'last'); // add new pair line
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
            if (!isFirst) prev = this._model[index - 1];
            if (!isLast) next = this._model[index + 1];
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
        const {isFirst, isLast, prev, next} = this.getOrder(input.dataset.index);

        if (event.key === 'ArrowUp' && !isFirst && prev) {
            const prevInput = prev[input.name].input;
            prevInput.focus();
            if (prevInput.type !== 'checkbox') prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
        } else if (event.key === 'ArrowDown' && !isLast && next) {
            const nextInput = next[input.name].input;
            nextInput.focus();
            if (nextInput.type !== 'checkbox') nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        } else if (event.key === 'D' && event.shiftKey && event.ctrlKey) {
            const {key: {content: key}, value: {content: value}} = input.pairLink || this._model[input.dataset.index];
            // this.createPair(key, value, false, input.dataset.index + this._duplicateIndexStep);
            //TODO: bug, add two new pairs instead of one
            //TODO: duplicate line, and focus new pair, reorder pairs
            //TODO: invalidate duplicated keys
        } else if (event.key === 'y' && event.ctrlKey) {
            this.removePair(input.dataset.index);
            if (isFirst && next) next[input.name].input.focus();
            else if (prev) prev[input.name].input.focus();
        } else {
            this.debounceUpdate(event);
        }

        event.preventDefault();
    }

    validateKeys() {
        const uniqueKeys = {};
        Array.from(this._model).slice(0, -1).forEach(({key}) => {
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

    createInput(index, name, value, pairLink) {
        const input = document.createElement('input');

        if (typeof value !== 'boolean' || !this._useTypes) {
            input.value = value;
        } else {
            input.type = 'checkbox';
            input.checked = value;
            const unwrap = () => {
                input.type = 'text';
                input.value = String(input.checked);
                input.removeEventListener('dblclick', unwrap);
            };
            input.addEventListener('dblclick', unwrap);
        }

        input.setAttribute('name', name);
        input.pairLink = pairLink;
        input.dataset.index = index;

        return input;
    }

    createPair(key, value, isLast = false, index = this._index++) {
        const link = this._model[index] = { index, isLast };

        Object.assign(link, {
            key: {
                content: key,
                input: this.createInput(index, 'key', key, link)
            },
            value: {
                content: value,
                input: this.createInput(index, 'value', value, link)
            }
        });

        this.shadowRoot.appendChild(link.key.input);
        this.shadowRoot.appendChild(link.value.input);

        if (isLast) this._lastIndex = index;

        return index;
    }

    update(event) {
        const input = event.path[0];
        const pairIndex = input.dataset.index;
        const pairLink = input.pairLink || this._model[pairIndex];
        const inputLink = pairLink[input.name];

        const inputValue = input.type === 'checkbox' ? input.checked : input.value;
        if (inputLink.content === inputValue) return;

        inputLink.content = inputValue;

        if (!pairLink.key.content && !pairLink.value.content) {
            this.removePair(pairIndex);
        } else if (pairLink.isLast) {
            pairLink.isLast = false;
            this._lastIndex = this.createPair('', '', 'last');
        }

        if (this.onchange && this.onchange instanceof Function) this.onchange(this.kv);
        this.validateKeys();
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
        this.shadowRoot.innerHTML = template;

        this._uiCache = {
            title: this.shadowRoot.getElementById('title'),
            keyTitle: this.shadowRoot.getElementById('key-title'),
            valueTitle: this.shadowRoot.getElementById('value-title')
        };

        this.shadowRoot.addEventListener('change', e => this.debounceUpdate(e));
        this.shadowRoot.addEventListener('keyup', e => this.keyupHandler(e));

        this.updateUI();
    }

    updateUI() {
        const title = this.title || this.getAttribute('title') || '';
        const keyTitle = this.keyTitle || this['key-title'] || this.getAttribute('key-title') || '';
        const valueTitle = this.valueTitle || this['value-title'] || this.getAttribute('value-title') || '';

        if (title) {
            this._uiCache.title.innerHTML = title;
        }

        if (keyTitle || valueTitle) {
            this._uiCache.keyTitle.innerHTML = keyTitle;
            this._uiCache.valueTitle.innerHTML = valueTitle;
        }
    }

    reset() {
        const currentModel = this.kv;
        this.initRender();
        this.kv = currentModel;
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        switch (attrName) {
            case 'debounce':
                this._debounce = isNaN(parseInt(newVal)) ? 0 : parseInt(newVal);
                break;
            case 'use-types':
                this._useTypes = !!this.restoreValueType(newVal);
                this.reset();
                break;
            default:
                this.updateUI();
        }
    }

}

window.customElements.define('kv-input', KVInput);