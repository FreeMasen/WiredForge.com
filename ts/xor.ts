import Converter from './services/convert';

let xor;
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    xor = new Xor();
})
class Xor {
    constructor() {
        console.log('new Xor()')
        this.registerEvents();
    }
    registerEvents() {
        console.log('registerEvents')
        let btn = document.getElementById('compute-xor') as HTMLButtonElement;
        if (btn) btn.addEventListener('click',ev => this.updateTotal(ev));
        let lhs = document.getElementById('lhs') as HTMLInputElement;
        if (lhs) lhs.addEventListener('change', ev => this.updateLeftSpan());
        let rhs = document.getElementById('rhs') as HTMLInputElement;
        if (rhs) rhs.addEventListener('change', ev => this.updateRightSpan());
    }

    updateTotal(ev: MouseEvent) {
        console.log('updateTotal', ev);
        let newVal = this.calculate();
        let valText = Converter.bit_string(newVal);
        let intSpan = document.getElementById('total-value') as HTMLSpanElement;
        if (intSpan) intSpan.innerHTML = newVal.toString();
        let binSpan = document.getElementById('binary-total') as HTMLSpanElement;
        if (binSpan) binSpan.innerHTML = valText;
    }

    updateLeftSpan() {
        console.log('updateLeftSpan');
        let span = document.getElementById('big-bits') as HTMLSpanElement
        let val = this.getLhs();
        let valText = Converter.bit_string(val);
        span.innerHTML = valText;
    }

    updateRightSpan() {
        console.log('updateRightSpan');
        let span = document.getElementById('little-bits') as HTMLSpanElement
        let val = this.getRhs();
        let valText = Converter.bit_string(val);
        span.innerHTML = valText;
    }

    calculate(): number {
        console.log('calculate');
        let lhs = this.getLhs();
        let rhs = this.getRhs();
        return lhs ^ rhs;
    }

    getLhs(): number {
        let input = document.getElementById('lhs') as HTMLInputElement;
        try {
            return parseInt(input.value);
        } catch (e) {
            console.error('Unable to parese lhs.value', e);
            return 0;
        }
    }

    getRhs(): number {
        let input = document.getElementById('rhs') as HTMLInputElement;
        try {
            return parseInt(input.value);
        } catch (e) {
            console.error('Unable to parse rhs.value', e);
            return 0;
        }
    }
}