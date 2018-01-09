import HTMLHelper from './HtmlHelper';
let andOr;
window.addEventListener('DOMContentLoaded', () => {
    andOr = new AndOr();
});

class AndOr {
    public leftBits = [0,0,0,0,0,0,0,0];
    public rightBits = [0,0,0,0,0,0,0,0];
    constructor(
        public lhs: number = 0,
        public rhs: number = 0
    ) {
        console.log('new AndOr')
        this.registerEvents();
    }

    registerEvents() {
        console.log('registerEvents')
        let inputs = document.querySelectorAll('.user-input');
        console.log(inputs);
        for (var i = 0; i < inputs.length; i++) {
            let input = inputs[i] as HTMLInputElement;
            input.value = '0';
            input.addEventListener('change', ev => this.inputChanged())
        }
    }

    inputChanged() {
        console.log('inputChanged')
        let lhs = document.getElementById('left-bits') as HTMLInputElement;
        let leftValue = parseInt(lhs.value);
        let rhs = document.getElementById('right-bits') as HTMLInputElement;
        let rightValue = parseInt(rhs.value);
        this.lhs = leftValue;
        this.leftBits = this.getBits(leftValue);
        this.rhs = rightValue;
        this.rightBits = this.getBits(rightValue);
        this.updateBits();
    }

    getBits(value: number) {
        console.log('gitBits', value);
        let ret = [];
        let bit = 1;
        for (var i = 0; i < 8; i++) {
            if ((value & bit) > 0) {
                ret.unshift(1);
            } else {
                ret.unshift(0);
            }
            bit *= 2;
        }
        return ret;
    }

    updateBits() {
        console.log('updateBits');
        let bytes = document.querySelector('.representation') as HTMLElement;
        HTMLHelper.clearChildren(bytes);
        let leftSpan = document.createElement('span');
        leftSpan.setAttribute('id', 'big-bits');
        let leftText = document.createTextNode(this.byteString(this.leftBits));
        leftSpan.appendChild(leftText);

        let rightSpan = document.createElement('span');
        rightSpan.setAttribute('id', 'little-bits');
        let rightText = document.createTextNode(this.byteString(this.rightBits));
        rightSpan.appendChild(rightText);

        bytes.appendChild(leftSpan);
        bytes.appendChild(rightSpan);
    }

    byteString(bits: Array<number>): string {
        console.log('byteString', bits);
        let ret = '';
        for (var i = 0; i < bits.length; i++) {
            let bit = bits[i];
            ret += `${bit}`;
            if (ret.length == 4) ret += ' ';
        }
        return ret;
    }
}