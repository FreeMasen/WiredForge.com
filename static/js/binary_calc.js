window.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
});
let bits = [];
function addEventListeners() {
    captureBigUints()
    let numbers = document.querySelectorAll('.bit-value');
    let switches = document.querySelectorAll('.bit-switch');
    for (let num of numbers) {
        num.addEventListener('click', event => {
            flipBit(event);
            let newValue = count();
            updateTotal(newValue);
        });
    }

}

function flipBit(event) {
    let span = event.currentTarget;
    let input = event.currentTarget.parentNode.querySelector('.bit-switch');
    console.log('flipBit', span, input);
    let value = parseInt(span.innerHTML);
    if (value == 1) {
        span.previousElementSibling.checked = false;
        span.innerHTML = '0';
    } else {
        span.previousElementSibling = true;
        span.innerHTML = '1';
    }
    console.log('flipedBit', span, span.previousElementSibling);
}

function captureBigUints() {
    let switches = document.querySelectorAll('.bit-value');
    let bit = new Bit();
    for (var i = 0; i < switches.length; i++) {
        switches[switches.length - (i + 1)].setAttribute('uint-index', i);
        bit = bit.next()
        bits.push(bit);
    }
}

function count() {
    let values = []
    let elements = document.querySelectorAll('.bit-value');
    let switches = Array.from(elements, s => [s.getAttribute('uint-index'), s.innerHTML == '1'])
    let flipped = switches.filter(sw => sw[1]);
    for (let sw of flipped) {
        values.push(bits[sw[0]]);
    }
    let newNum = values.reduce((acc, curr) => {
        acc.add(curr);
        return acc;
    }, new Bit());
    return newNum.toString();
}

function updateTotal(newValue) {
    let total = document.getElementById('current-total');
    total.innerHTML = newValue;
}

function Bit() {
    this.data = [];
    this.next = function() {
        let nextBit = new Bit();
        if (this.data.length < 1) {
            nextBit.data = [1];
        } else {
            nextBit.data = this.data.slice(0).map(v => v * 2);
            nextBit.realign();
        }
        return nextBit;
    };
    this.realign = function() {
        let carryOver = 0;
        for (let i = this.data.length - 1;i >= 0;i--) {
            let current = this.data[i];
            let update = 0;
            if (carryOver > 0) {
                update += carryOver;
                carryOver = 0;
            }
            update += current;
            while (update > 9) {
                update -= 10;
                carryOver++
            }
            this.data[i] = update;
        }
        if (carryOver > 0) {
            this.data.unshift(carryOver);
        }
    }
    this.add = function(other) {
        let revOther = other.data.slice(0).reverse();
        let revSelf = this.data.slice(0).reverse();
        for (var i = 0; i < other.data.length; i++) {
            let curOther = revOther[i];
            let curSelf = revSelf[i];
            if (curSelf === undefined) {
                revSelf.push(curOther);
            } else {
                let newVal = (curOther || 0) + curSelf;
                revSelf[i] = newVal;
            }
        }
        this.data = revSelf.slice(0).reverse();
        this.realign();
    }
    this.toString = function() {
        if (this.data.length == 0) return '0';
        return this.data.join('');
    }
}
