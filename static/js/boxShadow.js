import Color from '/js/models/color.js';
import Text from '/js/services/text.js';
import Clipboard from '/js/services/clipboard.js';
let boxShadow;

window.addEventListener('DOMContentLoaded', () => {
    boxShadow = new BoxShadow();
});

class BoxShadow {
    constructor(
        shadows = [Shadow.random()],
    ) {
        this.shadows = shadows;
        this.registerEventListeners();
        this.render();
        this.updateBoxShadow();
    }

    render() {
        let formsContainer = document.getElementById('shadows-list');
        if (!formsContainer) return console.error('Unable to find forms container');
        while (formsContainer.hasChildNodes()) {
            formsContainer.removeChild(formsContainer.lastChild);
        }
        if (this.shadows.length < 1) {
            let womp = document.createElement('h3');
            womp.setAttribute('id', 'no-shadows-msg');
            womp.appendChild(document.createTextNode('Womp Womp, no box-shadows'))
            formsContainer.appendChild(womp);
        }
        this.shadows.forEach((s, i) => {
            formsContainer.appendChild(this.constructShadowForm(s, i))
        });
    }

    updateBoxShadow() {
        let target = document.getElementById('target');
        if (!target) return console.error('Unable to find target container');
        let newValue = this.getBoxShadowProperty();
        target.setAttribute('style', `box-shadow: ${newValue}`);
        requestAnimationFrame(() => this.updateBoxShadow());
    }

    copyCss(ev) {
        let css =this.getBoxShadowProperty();
        Clipboard.copy(css).then(() => {
            this.showPopup(`copied: '${css}'`, ev.pageY + 15, ev.pageX + 10);
        })
        .catch(e => {
            console.error('Error copying text', e);
        });
    }

    showPopup(msg, top, left) {
        let popup = document.createElement('div');
        let text = document.createElement('span');
        text.appendChild(document.createTextNode(msg));
        popup.setAttribute('class', 'clipboard-popup');
        let clientWidth = document.body.getBoundingClientRect().width;
        popup.setAttribute('style', `position: absolute;top: ${top}px;left: ${left}px;max-width: ${clientWidth - left};`);
        popup.appendChild(text);
        document.body.appendChild(popup);
        setTimeout(() => document.body.removeChild(popup), 2000);
    }

    getBoxShadowProperty() {
        return this.shadows.map(s => s.toString()).join(',');
    }

    registerEventListeners() {
        let btn = document.getElementById('new-shadow-button');
        if (!btn) return console.error('Unable to find new shadow button');
        btn.addEventListener('click', () => {
            this.shadows.push(Shadow.random());
            setTimeout(() => this.render(), 0);
        });
        let copy = document.getElementById('copy-css-property');
        if (!copy) return console.error('Unable to find copy button');
        copy.addEventListener('click', ev => this.copyCss(ev));
    }

    constructShadowForm(shadow, i) {
        let ret = document.createElement('div');
        ret.setAttribute('class', 'shadow-container');
        ret.setAttribute('id', `shadow-container-${i}`);
        let titleContainer = document.createElement('div');
        titleContainer.setAttribute('class', 'shadow-form-title-container');
        let title = document.createElement('h3');
        title.appendChild(document.createTextNode(`Shadow ${i + 1}`));
        titleContainer.appendChild(title);
        let removeButton = document.createElement('button');
        removeButton.setAttribute('class', 'remove-form-button button');
        removeButton.appendChild(document.createTextNode('X'));
        titleContainer.appendChild(removeButton);
        ret.appendChild(titleContainer);
        ret.appendChild(this.constructShadowFormPair('offset-x', shadow.offsetX,i, false, -10));
        ret.appendChild(this.constructShadowFormPair('offset-y', shadow.offsetY, i, false, -10));
        ret.appendChild(this.constructShadowFormPair('blur-radius', shadow.blurRadius, i, false));
        ret.appendChild(this.constructShadowFormPair('spread-radius', shadow.spreadRadius, i, false, -10));
        ret.appendChild(this.constructShadowColor(shadow.color, i));
        removeButton.addEventListener('click', () => {
            ret.parentElement.removeChild(ret);
            this.deleteShadow(i)
        });
        return ret;
    }

    constructShadowFormPair(name, value, i, isColor, minValue = 0, maxValue = 10) {
        let ret = document.createElement('div');
        ret.setAttribute('class', 'shadow-form-input-pair');
        let id = `${name.toLowerCase().replace(/\s/g, '-')}-${i}`;
        ret.appendChild(this.constructShadowFormLabel(id, name));
        ret.appendChild(this.constructShadowFormInput(name, value, i, isColor, minValue, maxValue));
        return ret;
    }

    constructShadowColor(c, i) {
        let ret = document.createElement('div');
        ret.setAttribute('class', 'shadow-color');
        let title = document.createElement('h3');
        title.appendChild(document.createTextNode(`Color ${i}`));
        ret.appendChild(title);
        let mixer = document.createElement('div');
        mixer.setAttribute('class', 'shadow-color-set');
        mixer.appendChild(this.constructShadowColorProp('Red', c.red, i));
        mixer.appendChild(this.constructShadowColorProp('Green', c.green, i));
        mixer.appendChild(this.constructShadowColorProp('Blue', c.blue, i));
        mixer.appendChild(this.constructShadowColorProp('Alpha', c.alpha, i, 1));
        ret.appendChild(mixer);
        return ret;
    }

    constructShadowColorProp(name, v, i, maxValue = 255) {
        let ret = document.createElement('div');
        ret.setAttribute('class', 'shadow-color-value');
        let pair = this.constructShadowFormPair(name, v, i, true, 0, maxValue);
        ret.appendChild(pair);
        return ret;
    }

    constructShadowFormLabel(id, title) {
        let ret = document.createElement('label');
        ret.setAttribute('for', id);
        ret.setAttribute('class', 'shadow-form-label');
        ret.appendChild(document.createTextNode(title));
        return ret;
    }

    constructShadowFormInput(name, value, i, isColor = false,min = 0, max = 100) {
        let id = `${name.toLowerCase().replace(/\s/g, '-')}-${i}`;
        let ret = document.createElement('div');
        ret.setAttribute('class', 'slider-input-pair');
        let slider = new Slider(i, isColor, Text.kabobToCamel(name), value, min, max)
        let sliderEl = slider.render();
        ret.appendChild(sliderEl);
        let input = document.createElement('input');
        input.setAttribute('id', id);
        sliderEl.addEventListener('value-changed', (ev) => this.eventHandler(ev.detail, input));
        input.setAttribute('value', `${value}`);
        input.addEventListener('change', ev => slider.newValue(parseInt((ev.target).value)))
        ret.appendChild(input);
        return ret;
    }

    eventHandler(detail, input) {
        let newValue = detail.pos;
        if (!detail.fromInputUpdate) {
            input.setAttribute('value', newValue.toFixed(2));
        }
        let shadow = this.shadows[detail.containerId];
        if (detail.isColor) {
            shadow.color[detail.name] = newValue;
        } else {
            shadow[detail.name] = newValue;
        }
        this.shadows[detail.containerId] = shadow;
    }

    deleteShadow(idx) {
        this.shadows.splice(idx, 1);
    }
}

class Shadow {
    constructor(
        offsetX = 0,
        offsetY = 0,
        blurRadius = 0,
        spreadRadius = 0,
        color = Color.random()
    ) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.blurRadius = blurRadius;
        this.spreadRadius = spreadRadius;
        this.color = color;
    }

    toString() {
        return `${this.offsetX}px ${this.offsetY}px ${this.blurRadius}px ${this.spreadRadius}px ${this.color.toRgbA()}`;
    }

    static random() {
        return new Shadow(
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
        )
    }
}


class Slider {
    currentPosition;
    container;
    slider;
    bar;
    dragCb;
    endDragCb;
    lastX;
    constructor(
        containerId,
        isColor,
        name,
        initialValue = 0,
        minValue = 0,
        maxValue = 255,
    ) {
        this.containerId = containerId;
        this.isColor = isColor;
        this.name = name;
        this.initialValue = initialValue;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.currentPosition = initialValue;
    }

    render() {
        let ret = document.createElement('div');
        this.container = ret;
        ret.setAttribute('class', 'input-slider');
        let bar = document.createElement('div');
        bar.setAttribute('class', 'slider-bar');
        ret.appendChild(bar);
        this.bar = bar;
        let slider = document.createElement('div');
        this.slider = slider;
        slider.setAttribute('class', 'slider-handle');
        slider.addEventListener('mousedown', ev => this.startDrag(ev));
        ret.appendChild(slider);
        this.updateSlider();
        return ret;
    }

    get offsetX() {
        return ((this.currentPosition - this.minValue) / (this.maxValue - this.minValue)) * 100;
    }

    drag(ev) {
        let width = this.bar.getBoundingClientRect().width;
        let movementX = ev.clientX - this.lastX;
        this.lastX = ev.clientX;
        let percentMoved = movementX / width;
        let totalSpread = this.maxValue - this.minValue;
        this.currentPosition += percentMoved * (totalSpread);
        if (this.currentPosition < this.minValue) {
            this.currentPosition = this.minValue;
        }
        if (this.currentPosition > this.maxValue) {
            this.currentPosition = this.maxValue;
        }
        this.updateSlider();
    }

    updateSlider(fromInputUpdate = false) {
        this.slider.style.left = `${this.offsetX}%`;
        this.container.dispatchEvent(new CustomEvent('value-changed', {detail: this.eventDetail(fromInputUpdate)}));
    }

    startDrag(ev) {
        this.lastX = ev.clientX;
        this.dragCb = this.drag.bind(this);
        this.endDragCb = this.endDrag.bind(this);
        window.addEventListener('mousemove', this.dragCb);
        window.addEventListener('mouseup', this.endDragCb);
    }

    endDrag() {
        window.removeEventListener('mousemove', this.dragCb);
        window.removeEventListener('mouseup', this.endDragCb);
    }
    newValue(v) {
        this.currentPosition = v;
        if (this.currentPosition > this.maxValue) {
            this.currentPosition = this.maxValue;
        }
        if (this.currentPosition < 0) {
            this.currentPosition = 0;
        }
        this.updateSlider(true);
    }

    eventDetail(fromInputUpdate) {
        return {
            pos: this.currentPosition,
            fromInputUpdate,
            containerId: this.containerId,
            name: this.name,
            isColor: this.isColor,
        }
    }
}
