import Converter from './services/convert';
let not;
window.addEventListener('DOMContentLoaded', () => {
    not = new BinaryNot();
});

class BinaryNot {
    constructor() {
        this.registerEvents();
        this.valueChanged();
    }
    registerEvents() {
        let input = document.getElementById('value');
        if (input) input.addEventListener('change', ev => this.valueChanged());
        let button = document.getElementById('compute-not');
        if (button) button.addEventListener('click', ev => this.computeNot());
    }

    valueChanged() {
        let val = this.getValue();
        let bits = document.getElementById('bits');
        if (!bits) return console.error('unable to find input bits');
        bits.innerHTML = Converter.bit_string(val);
    }

    computeNot() {
        let val = this.getValue();
        let bits = document.getElementById('binary-total');
        if (!bits) return console.error('unable to find total bits');
        let total = document.getElementById('total-value');
        if (!total) return console.error('unable to find total value');
        let not = this.getNot(val);
        total.innerHTML = not.toString();
        bits.innerHTML = Converter.bit_string(not);
    }

    getNot(value) {
        let ret = 0;
        let bit = 1;
        for (var i = 0; i < 8; i++) {
            if ((value & bit) < 1) {
                ret |= bit;
            } 
            bit *= 2;
        }
        return ret;
    }

    getValue() {
        let input = document.getElementById('value') as HTMLInputElement;
        if (!input) {
            console.error('unable to find input'); 
            return 0;
        }
        try {
            return parseInt(input.value);
        } catch (e) {
            console.error('Unable to parse int'); 
            return 0;
        }
    }
}