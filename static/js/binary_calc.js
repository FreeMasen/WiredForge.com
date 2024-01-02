import Bit from '/js/binar_calc/Bit.js';
let binary_calc;
window.addEventListener('DOMContentLoaded', () => {
    binary_calc = new BinaryCalculator();
});

class BinaryCalculator {
    bits = [];
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
        let numbers = document.querySelectorAll('.bit-value');
        for (var i = 0; i < numbers.length; i++) {
            numbers[i].addEventListener('click', ev => this.flipBit(ev));
        }
    }

    flipBit(ev) {
        let span = ev.currentTarget;
        let input = span.previousElementSibling;
        let value = span.innerHTML;
        if (value == '1') {
            span.innerHTML = '0';
        } else {
            span.innerHTML = '1';
        }
        let newValue = this.count();
        this.updateTotal(newValue);
    }

    count() {
        let ret = new Bit();
        let values = []
        let elements = document.querySelectorAll('.bit-value');
        for (var i = 0; i < elements.length; i++) {
            let value = elements[i];
            if (value.innerHTML == '1') {
                let uintIndex = parseInt(value.getAttribute('uint-index'));
                let onBit = this.bits[uintIndex];
                ret.add(onBit.copy());
            }
        }
        return ret;
    }

    updateTotal(newValue) {
        let total = document.getElementById('current-total');
        total.innerHTML = newValue.toString();
    }
}
