let slider;
window.addEventListener('DOMContentLoaded', () => {
    slider = new TwosCompSlider();
});

export class TwosCompSlider {
    dragging = false;
    lastMouseX;
    lastMouseY
    slider;
    position = 0;
    containerSize;
    constructor() {
        this.slider = document.getElementById('twos-comp-slider-position');
        if (!this.slider) {
            throw new Error('unable to find slider div');
        }
        let container = document.getElementById('twos-comp-slider');
        if (!container) {
            throw new Error('unable to find slider container');
        }
        this.containerSize = container.clientWidth;
        this.registerEvents();
    }

    registerEvents() {
        this.slider.addEventListener('mousedown', ev => this.dragStart(ev));
        window.addEventListener('mouseup', ev => this.dragEnd());
        window.addEventListener('mousemove', ev => this.drag(ev))
    }

    dragStart(ev) {
        this.dragging = true;
        this.lastMouseX = ev.clientX;
    }

    drag(ev) {
        if (this.dragging) {
            let width = this.slider.parentElement.getBoundingClientRect().width;
            let movementX = ev.clientX - this.lastMouseX;
            this.lastMouseX = ev.clientX;
            let percentMoved = -(movementX / width);
            let moved = percentMoved * 254;
            if (this.position + moved > 255) {
                this.position = 255
            } else if (this.position + moved < 1) {
                this.position = 1;
            } else {
                this.position += moved;
            }
            let newOffset = ((this.position / 254))* 100;
            newOffset = 100 - newOffset;
            this.slider.style.left = `${newOffset.toFixed(2)}%`
            this.updateTotals();
        }
    }

    dragEnd() {
        this.dragging = false;
    }

    updateTotals() {
        let u = document.getElementById('twos-comp-slider-unsigned');
        if (!u) {
            return console.error('Unable to find unsigned total');
        }
        u.innerHTML = Math.floor(this.position).toFixed(0);
        let i = document.getElementById('twos-comp-slider-signed');
        if (!i) {
            return console.error('Unable to find signed total');
        }
        i.innerHTML = Math.floor(this.signed).toFixed(0);
        let b = document.getElementById('twos-comp-slider-bin');
        if (!b) {
            return console.error('unable to find bin total');
        }
        let bin = `${'0'.repeat(8)}${Math.floor(this.position).toString(2)}`.substr(-8);
        while (b.hasChildNodes()) {
            b.removeChild(b.firstChild);
        }
        let firstHalf = document.createElement('span');
        firstHalf.classList.add('nibble', 'big-end');
        firstHalf.appendChild(document.createTextNode(bin.substr(0,4)));
        b.appendChild(firstHalf);
        let lastHalf = document.createElement('span');
        lastHalf.classList.add('nibble', 'little-end');
        lastHalf.appendChild(document.createTextNode(bin.substr(3,4)))
        b.appendChild(lastHalf);
    }

    get signed() {
        let unsigned = Math.floor(this.position);
        let max = 2**8;
        if (unsigned >= max / 2) {
            return -(max - unsigned);
        } else {
            return unsigned;
        }
    }
}
