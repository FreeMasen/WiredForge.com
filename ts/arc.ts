import HTMLHelper from "./HtmlHelper";

let arc;

window.addEventListener('DOMContentLoaded',() => {
    arc = new Arcer();
});

class Arcer {
    private context: CanvasRenderingContext2D;
    private parentContainer: HTMLDivElement;
    private form: ArcForm;
    constructor(
        public width =500,
        public height = 500,
        public startX = 0,
        public startY = 0,
        public cx1 = 0,
        public cy1 = 0,
        public cx2 = 0,
        public cy2 = 0,
        public endX = 0,
        public endY = 0
    ) {
        this.parentContainer = document.querySelector('.arc');
        this.createForm();
        this.createCanvas();
        this.draw();
    }

    createForm() {
        this.form = new ArcForm((id, value) => this.formUpdated(id, value));
        this.parentContainer.appendChild(this.form.html())
    }

    formUpdated(id: string, value: string) {
        let val = parseInt(value);
        switch(id) {
            case 'width-input':
                this.width = val;
                this.createCanvas();
            break;
            case 'height-input':
                this.height = val;
                this.createCanvas()
            break;
            case 'start-x-input':
                this.startX = val;
            break;
            case 'start-y-input':
                this.startY = val;
            break;
            case 'control-point-1-x-input':
                this.cx1 = val;
            break;
            case 'control-point-1-y-input':
                this.cy1 = val;
            break;
            case 'control-point-2-x-input':
                this.cx2 = val;
            break;
            case 'control-point-2-y-input':
                this.cy2 = val;
            break;
            case 'end-x-input':
                this.endX = val;
            break;
            case 'end-y-input':
                this.endY = val;
            break;
        }
        this.draw();
    }

    

    createCanvas() {
        let currentCanvas = document.getElementById('canvas');
        if (currentCanvas) this.parentContainer.removeChild(currentCanvas);
        let canvas = document.createElement('canvas');
        canvas.setAttribute('width', `${this.width}px`);
        canvas.setAttribute('height', `${this.height}px`);
        canvas.setAttribute('id', 'canvas');
        this.context = canvas.getContext('2d');
        this.parentContainer.appendChild(canvas);
    }

    draw() {
        if (!this.context) return;
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.save();
        this.drawLine();
        this.drawStartEnd();
        this.drawCPs();
        this.context.restore();
    }

    drawLine() {
        this.context.beginPath();
        this.context.strokeStyle = 'black';
        this.context.moveTo(this.startX, this.startY);
        this.context.bezierCurveTo(this.cx1, this.cy1, this.cx2, this.cy2, this.endX, this.endY);
        this.context.stroke();
        this.context.closePath();
    }

    drawStartEnd() {
        this.context.beginPath();
        this.context.strokeStyle = 'none';
        this.context.fillStyle = 'green';
        this.context.ellipse(this.startX, this.startY, 4, 4, 0, 0, 360, false);
        this.context.fill();
        this.context.closePath();
        this.context.beginPath();
        this.context.fillStyle = 'red';
        this.context.ellipse(this.endX, this.endY, 4, 4, 0, 0, 260);
        this.context.fill();
        this.context.closePath();
    }

    drawCPs() {
        this.context.beginPath();
        this.context.strokeStyle = 'none';
        this.context.fillStyle = 'blue';
        this.context.ellipse(this.cx1, this.cy1, 4, 4, 0, 0, 360, false);
        this.context.fill();
        this.context.closePath();
        this.context.beginPath();
        this.context.fillStyle = 'purple';
        this.context.ellipse(this.cx2, this.cy2, 4, 4, 0, 0, 260);
        this.context.fill();
        this.context.closePath();
    }
}

class ArcForm {
    constructor(
        private listener: (control: string, newValue: string) => void;
    ) {

    }

    html(): HTMLDivElement {
        let container = HTMLHelper.div('input-form');
        let width = this.inputGroup('Width', 'width-input', 'number', '500');
        let height = this.inputGroup('Height', 'height-input', 'number', '500');
        let group = this.inputGroupGroup(width, height);
        let widthHeightGroup = this.controlGroup('Canvas Size', group);
        container.appendChild(widthHeightGroup);
        let start = this.XYControlGroup('Start');
        container.appendChild(start);
        let control1 = this.XYControlGroup('Control Point 1');
        container.appendChild(control1);
        let control2 = this.XYControlGroup('Control Point 2');
        container.appendChild(control2);
        let end = this.XYControlGroup('End');
        container.appendChild(end);
        return container;
    }

    XYControlGroup(name: string) {
        let initialX = Math.floor(Math.random() * 500);
        let initialY = Math.floor(Math.random() * 500);
        let idPrefix = name.replace(/\s/g, '-').toLowerCase();
        let idX = `${idPrefix}-x-input`;
        let idY = `${idPrefix}-y-input`;
        let x = this.inputGroup('X', idX, 'number', `${initialX}`);
        let y = this.inputGroup('Y', idY, 'number', `${initialY}`);
        this.listener(idX, `${initialX}`);
        this.listener(idY, `${initialY}`);
        let group = this.inputGroupGroup(x, y);
        return this.controlGroup(name, group);
    }

    inputGroup(labelText: string, 
                inputId: string = null,
                inputType: string = 'text', 
                initialValue: string = null): HTMLDivElement {
        let container = HTMLHelper.div('input-group');
        let label = HTMLHelper.label(labelText, inputId);
        label.setAttribute('for', inputId);
        let input = HTMLHelper.textBox('input', inputId);
        input.setAttribute('value', initialValue);
        input.setAttribute('type', inputType);
        input.addEventListener('change', ev => this.listener(inputId, (ev.currentTarget as HTMLInputElement).value))
        container.appendChild(label);
        container.appendChild(input);
        return container;
    }

    inputGroupGroup(...groups: Array<HTMLDivElement>): HTMLDivElement {
        let container = HTMLHelper.div('input-group-group');
        for (var i = 0; i < groups.length; i++) {
            container.appendChild(groups[i]);
        }
        return container;
    }

    controlGroup(name: string, group: HTMLDivElement): HTMLDivElement {
        let container = HTMLHelper.div('control-group');
        let span = HTMLHelper.span(name, 'control-group-title');
        container.appendChild(span);
        container.appendChild(group);
        return container;
    }
}