import HTMLHelper from './HtmlHelper';
let shifter;

window.addEventListener('DOMContentLoaded', () => {
    shifter = new Shifter();
});

class Shifter {
    public bits: Array<number> = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1];
    constructor(
        public value: number = 1,
        public currentMovement: number = 0
    ) {
        this.registerEventListeners();
        this.updateValues();
    }

    registerEventListeners() {
        let buttons = document.querySelectorAll('#shifter-wrapper > .adjustments > .shift-buttons > .shift-button');
        for (var i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            button.addEventListener('click', ev => this.shiftBits(ev))
        }
        let input = document.querySelector('#shifter-wrapper > .values > .input-group > #u16');
        input.addEventListener('change', ev => this.inputChanged());
    }

    inputChanged() {
        let input = document.querySelector('#shifter-wrapper > .values > .input-group > #u16') as HTMLInputElement;
        let value = parseInt(input.value);
        this.bits = this.getBits(value);
        this.currentMovement = 0;
        this.updateBits();
        this.updateButtons();
    }

    shiftBits(ev: Event) {
        let button = ev.currentTarget as HTMLButtonElement;
        if (button.disabled) return;
        if (button.getAttribute('id') == 'left-shift') {
            this.currentMovement--
            this.bits.push(this.bits.shift())
        } else {
            this.currentMovement++;
            this.bits.unshift(this.bits.pop())
        }
        this.updateValues();
    }

    updateValues() {
        this.updateCounter();
        this.updateInput();
        this.updateBits();
        this.updateButtons();
    }

    updateButtons() {
        let leftShift = document.querySelector('#shifter-wrapper > .adjustments > .shift-buttons > #left-shift');
        let rightShift = document.querySelector('#shifter-wrapper > .adjustments > .shift-buttons > #right-shift');
        let zeroCount = this.bits.filter(v => v > 0).length;
        if (this.bits[0] == 1 || zeroCount < 1) {
            leftShift.setAttribute('disabled', 'true');
        } else {
            leftShift.removeAttribute('disabled');
        }
        if (this.bits[this.bits.length - 1] == 1 || zeroCount < 1) {
            rightShift.setAttribute('disabled', 'false');
        } else {
            rightShift.removeAttribute('disabled');
        }
    }
    
    updateCounter() {
        let counter = document.querySelector('#shifter-wrapper .adjustments > .counter') as HTMLSpanElement;
        HTMLHelper.clearChildren(counter);
        let title = document.createElement('span') as HTMLSpanElement;
        title.setAttribute('id', 'shift-counter');
        let titleText = document.createTextNode('Current Movement: ');
        title.appendChild(titleText);
        counter.appendChild(title);
        let span = document.createElement('span') as HTMLSpanElement;
        span.setAttribute('id', 'counter-value');
        let prefix = '';
        if (this.currentMovement > 0) {
            prefix = 'right';
        }
        if (this.currentMovement < 0) {
            prefix = 'left';
        }
        let spanText = document.createTextNode(`${prefix} ${Math.abs(this.currentMovement)}`);
        span.appendChild(spanText);
        counter.appendChild(span);
    }

    updateInput() {
        let input = document.querySelector('#shifter-wrapper > .values > .input-group > #u16') as HTMLInputElement;
        input.value = `${this.getValue()}`;
    }

    updateBits() {
        let bits = document.querySelector('.representation') as HTMLElement;
        HTMLHelper.clearChildren(bits);
        let leftBits = document.querySelector('#shifter-wrapper > .values > .representation > #little-bits');
        let bigBits = this.bits.slice(0, 8);
        let bigStr = '';
        for (var i = 0; i < bigBits.length; i++) {
            bigStr += `${bigBits[i]}`
            if (bigStr.length == 4) {
                bigStr += ' ';
            }
        }
        let bigSpan = document.createElement('span') as HTMLSpanElement;
        bigSpan.setAttribute('id', 'big-bits');
        let bigText = document.createTextNode(bigStr);
        bigSpan.appendChild(bigText);
        bits.appendChild(bigSpan);

        let rightBits = document.querySelector('#shifter-wrapper > .values > .representation > #little-bits');
        let littleBits = this.bits.slice(8);
        let littleStr = '';
        for (var i = 0; i < littleBits.length; i++) {
            littleStr += littleBits[i];
            if (littleStr.length == 4) {
                littleStr += ' ';
            }
        }
        let littleSpan = document.createElement('span') as HTMLSpanElement;
        littleSpan.setAttribute('id', 'little-bits');
        let littleText = document.createTextNode(littleStr)
        littleSpan.appendChild(littleText);
        bits.appendChild(littleSpan);
    }

    getBits(val: number): Array<number> {
        let ret = [];
        let bitValue = 1;
        for (var i = 0; i < this.bits.length; i++) {
            if ((val & bitValue) > 0) {
                ret.unshift(1);
            } else {
                ret.unshift(0);
            }
            bitValue *= 2;
        }
        return ret;
    }

    getValue(): number {
        let ret = 0;
        let bitValue = 1;
        for (var i = this.bits.length - 1; i >= 0; i--) {
            let bit = this.bits[i];
            if (bit == 1) {
                ret |= bitValue;
            } else {
                ret &= ~bitValue;
            }
            bitValue *= 2;
        }
        return ret;
    }
}