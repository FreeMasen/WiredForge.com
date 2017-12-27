let ender

window.addEventListener('DMContentLoaded', () => {
    ender = new Ender();
})

function Ender() {
    this.big = true;
    this.left = 0;
    this.right = 0;
    this.registerEvents = function() {
        let radios = document.querySelectorAll('.radio');
        for (let radio of radios) {
            radio.addEventListener('click', ev => this.switchEnd(ev));
        }
        let uints = document.querySelectorAll('.uint');
        for (let uint of uints) {
            uint.addEventListener('change', ev => this.uintChanged(ev));
            uint.value = 0;
        }
    }

    this.switchEnd = function(ev) {
        let radio = ev.currentTarget;
        if (radio.id == 'big') {
            this.big = true;
        } else {
            this.big = false;
        }
        this.updateDOM();
        this.updateRadios();
    }

    this.uintChanged = function(ev) {
        let input = ev.currentTarget;

        if (input.id == 'left-uint') {
            try {
                this.left = parseInt(input.value);
            } catch (e) {
                console.error('Unable to parse left');
                throw e;
            }
        } else {
            try {
                this.right = parseInt(input.value);
            } catch (e) {
                console.error('Unable to parse right');
                throw e;
            }
        }
        this.updateDOM();
    }

    this.uintBinary = function(uint) {
        let ret = [];
        for (var i = 1; i < 256; i = (i * 2)) {
            if ((uint & i) > 0) ret.unshift('1');
            else ret.unshift('0');
            if (ret.length == 4) ret.unshift(' ');
        }
        return ret.join('');
    }

    this.makeBig = function(uInt) {
        return uInt << 8;
    }

    this.calculate = function() {
        let big = this.big ? this.makeBig(this.left) : this.makeBig(this.right);
        let little = this.big ? this.right : this.left;
        return {
            binary: `${this.uintBinary(this.left)} ${this.uintBinary(this.right)}`,
            u16: big + little,
        }
    }

    this.updateDOM = function() {
        let calc = this.calculate();
        let binary = document.querySelector('#binary-representation');
        if (binary) {
            binary.innerHTML = calc.binary;
        }
        let u16 = document.querySelector('#u16-representation');
        if (u16){
            u16.innerHTML = calc.u16;
        }        
    }

    this.updateRadios = function() {
        let selectedClass = 'radio selected';
        let baseClass = 'radio'
        let bigRadio = document.getElementById('big');
        let littleRadio = document.getElementById('little');
        if (this.big) {
            bigRadio.setAttribute('class', selectedClass);
            littleRadio.setAttribute('class', baseClass);
        } else {
            bigRadio.setAttribute('class', baseClass);
            littleRadio.setAttribute('class', selectedClass);
        }
    }

    this.registerEvents();
    this.updateRadios();
    this.updateDOM();
}

if (!ender) {
    ender = new Ender();
}