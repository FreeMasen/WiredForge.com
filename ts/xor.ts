import Converter from './services/convert';

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
        let btn = document.querySelector('#xor-wrapper > .adjustments > .buttons > #compute-xor') as HTMLButtonElement;
        if (btn) btn.addEventListener('click',ev => this.updateTotal(ev));
        let lhs = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #lhs') as HTMLInputElement;
        if (lhs) lhs.addEventListener('change', ev => this.updateLeftSpan());
        let rhs = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #rhs') as HTMLInputElement;
        if (rhs) rhs.addEventListener('change', ev => this.updateRightSpan());
    }

    updateTotal(ev: MouseEvent) {
        let newVal = this.calculate();
        let valText = Converter.bit_string(newVal);
        let intSpan = document.querySelector('#xor-wrapper > .adjustments > .total > #total-value') as HTMLSpanElement;
        if (intSpan) intSpan.innerHTML = newVal.toString();
        let binSpan = document.querySelector('#xor-wrapper > .adjustments > .total > #binary-total') as HTMLSpanElement;
        if (binSpan) binSpan.innerHTML = valText;
    }

    updateLeftSpan() {
        let span = document.querySelector('#xor-wrapper > .values > .representation > #big-bits') as HTMLSpanElement
        let val = this.getLhs();
        let valText = Converter.bit_string(val);
        span.innerHTML = valText;
    }

    updateRightSpan() {
        let span = document.querySelector('#xor-wrapper > .values > .representation > #little-bits') as HTMLSpanElement
        let val = this.getRhs();
        let valText = Converter.bit_string(val);
        span.innerHTML = valText;
    }

    calculate(): number {
        let lhs = this.getLhs();
        let rhs = this.getRhs();
        return lhs ^ rhs;
    }

    getLhs(): number {
        let input = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #lhs') as HTMLInputElement;
        try {
            return parseInt(input.value);
        } catch (e) {
            console.error('Unable to parese lhs.value', e);
            return 0;
        }
    }

    getRhs(): number {
        let input = document.querySelector('#xor-wrapper > .values > .inputs > .input-group > #rhs') as HTMLInputElement;
        try {
            return parseInt(input.value);
        } catch (e) {
            console.error('Unable to parse rhs.value', e);
            return 0;
        }
    }
}