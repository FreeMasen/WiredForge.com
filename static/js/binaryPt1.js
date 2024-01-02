let post;
window.addEventListener('DOMContentLoaded', () => {
    post = new BinaryPt1();
});

class BinaryPt1 {
    countingState = 0;
    countingTimeout;
    countRunning = false;
    constructor() {
        this.registerListeners();
    }

    registerListeners() {
        let btn = this.getButton();
        if (btn) btn.addEventListener('click', () => this.startCounting())
        let digits = this.getDigits();
        for (var i = 0; i < digits.length; i++) {
            let digit = digits[i];
            digit.addEventListener('click', ev => this.digitClicked(ev));
        }

    }

    startCounting() {
        this.countRunning = !this.countRunning;
        this.updateButton();
        if (this.countingTimeout != null) {
            clearTimeout(this.countingTimeout);
        }
        if (!this.countRunning) return;
        this.countingState = 0;
        this.count();
    }

    count() {
        this.countingTimeout = null;
        this.updateDigits(this.countingState);
        this.updateTotal();
        this.countingState++;
        if (this.countingState <= 255) {
            let percentComplete = this.countingState / 255;
            let timeout = 400 * (1 - percentComplete); 
            this.countingTimeout = setTimeout(() => this.count(), timeout);
        } else {
            this.countingState = 0;
            this.countRunning = false;
            this.updateButton();
        }
    }

    updateButton() {
        let button = this.getButton();
        if (this.countRunning) {
            button.innerHTML = 'Stop counting';
        } else {
            button.innerHTML = 'Start counting';
        }
    }

    updateDigits(numOfOnes) {
        let digits = this.getDigits();
        let digitValues = this.getDigitValues();
        var position = 1;
        for (var i = digits.length - 1; i >= 0; i--, position++) {
            let digit = digits[i];
            let value = digitValues[i];
            digit.innerHTML = value;
        }
    }

    getDigits(){
        return document.querySelectorAll('.digit');
    }

    getButton() {
        return document.getElementById('start-counting');
    }

    getDigitValues() {
        let ret = [];
        for (var i = 1; i < 255; i *= 2) {
            if ((this.countingState & i) > 0) {
                ret.unshift('1')
            } else {
                ret.unshift('0');
            }
        }
        return ret;
    }


    digitClicked(ev) {
        let cell = ev.currentTarget;
        if (cell.innerHTML == '1') {
            cell.innerHTML = '0';
        } else {
            cell.innerHTML = '1';
        }
        this.updateTotal();
    }
    
    updateTotal() {
        let totalCell = document.getElementById('total');
        let digits = this.getDigits();
        let total = 0;
        for (var i = 0; i < digits.length; i++) {
            var digit = digits[i];
            var bit = parseInt(digit.id);
            if (digit.innerHTML == '1') {
                total += bit;
            }
        }
        totalCell.innerHTML = total.toString();
    }
}
