import Converter from '/js/services/convert.js';

let xor;
window.addEventListener('DOMContentLoaded', () => {
    xor = new Xor();
})
class Xor {
    constructor() {
        this.registerEvents();
        this.updateLeftSpan();
        this.updateRightSpan();
    }
    registerEvents() {
        let btn = document.querySelector('#xor-wrapper > .adjustments > .buttons > #compute-xor');
        if (btn) btn.addEventListener('click',ev => this.updateTotal(ev));
        let lhs = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #lhs');
        if (lhs) lhs.addEventListener('change', ev => this.updateLeftSpan());
        let rhs = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #rhs');
        if (rhs) rhs.addEventListener('change', ev => this.updateRightSpan());
    }

    updateTotal(ev) {
        let newVal = this.calculate();
        let valText = Converter.bit_string(newVal);
        let intSpan = document.querySelector('#xor-wrapper > .adjustments > .total > #total-value');
        if (intSpan) intSpan.innerHTML = newVal.toString();
        let binSpan = document.querySelector('#xor-wrapper > .adjustments > .total > #binary-total');
        if (binSpan) binSpan.innerHTML = valText;
    }

    updateLeftSpan() {
        let span = document.querySelector('#xor-wrapper > .values > .representation > #big-bits');
        let val = this.getLhs()
        let valText = Converter.bit_string(val);
        span.innerHTML = valText;
    }

    updateRightSpan() {
        let span = document.querySelector('#xor-wrapper > .values > .representation > #little-bits')
        let val = this.getRhs();
        let valText = Converter.bit_string(val);
        span.innerHTML = valText;
    }

    calculate() {
        let lhs = this.getLhs();
        let rhs = this.getRhs();
        return lhs ^ rhs;
    }

    getLhs() {
        let input = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #lhs');
        try {
            return parseInt(input.value);
        } catch (e) {
            console.error('Unable to parese lhs.value', e);
            return 0;
        }
    }

    getRhs() {
        let input = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #rhs');
        try {
            return parseInt(input.value);
        } catch (e) {
            console.error('Unable to parse rhs.value', e);
            return 0;
        }
    }
}
