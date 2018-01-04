import Bit from './binar_calc/Bit';
let binary_calc;
window.addEventListener('DOMContentLoaded', () => {
    binary_calc = new BinaryCalculator();
});

class BinaryCalculator {
    bits: Array<Bit> = [];
    constructor() {
        this.captureBigUints();
        this.addEventListeners();
    }
    
    captureBigUints() {
        let switches = document.querySelectorAll('.bit-value');
        let bit = new Bit();
        for (var i = 0; i < switches.length; i++) {
            switches[switches.length - (i + 1)].setAttribute('uint-index', `${i}`);
            bit = bit.next()
            this.bits.push(bit);
        }
    }

    addEventListeners() {
        let numbers = document.querySelectorAll('.bit-value') as NodeListOf<HTMLSpanElement>;
        for (var i = 0; i < numbers.length; i++) {
            numbers[i].addEventListener('click', ev => this.flipBit(ev));
        }
    }

    flipBit(ev) {
        let span = ev.currentTarget as HTMLSpanElement;
        let input = span.previousElementSibling as HTMLInputElement;
        let value = span.innerHTML;
        if (value == '1') {
            span.innerHTML = '0';
        } else {
            span.innerHTML = '1';
        }
        let newValue = this.count();
        this.updateTotal(newValue);
    }

    count(): Bit {
        let ret = new Bit();
        console.log('counting', ret.toString());
        let values = []
        let elements = document.querySelectorAll('.bit-value') as NodeListOf<HTMLSpanElement>;
        for (var i = 0; i < elements.length; i++) {
            let value = elements[i];
            if (value.innerHTML == '1') {
                let uintIndex = parseInt(value.getAttribute('uint-index'));
                let onBit = this.bits[uintIndex];
                console.log('found on bit', uintIndex, onBit.toString());
                ret.add(onBit.copy());
            }
        }
        console.log('counted', ret.toString());
        return ret;
    }

    updateTotal(newValue: Bit) {
        let total = document.getElementById('current-total') as HTMLDivElement;
        total.innerHTML = newValue.toString();
    }
}