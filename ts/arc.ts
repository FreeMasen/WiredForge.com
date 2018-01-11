import HTMLHelper from "./HtmlHelper";
import Point from './pacman/grid/Point';
let arc;

window.addEventListener('DOMContentLoaded',() => {
    arc = new Arcer();
});

class Arcer {
    private context: CanvasRenderingContext2D;
    private parentContainer: HTMLDivElement;
    private form: ArcForm;
    private draggingPoint: {x: string, y: string};
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
            case 'startX':
                this.startX = val;
            break;
            case 'startY':
                this.startY = val;
            break;
            case 'cx1':
                this.cx1 = val;
            break;
            case 'cy1':
                this.cy1 = val;
            break;
            case 'cx2':
                this.cx2 = val;
            break;
            case 'cy2':
                this.cy2 = val;
            break;
            case 'endX':
                this.endX = val;
            break;
            case 'endY':
                this.endY = val;
            break;
        }
    }

    createCanvas() {
        let currentCanvas = document.getElementById('canvas');
        if (currentCanvas) this.parentContainer.removeChild(currentCanvas);
        let canvas = document.createElement('canvas');
        canvas.setAttribute('width', `${this.width}px`);
        canvas.setAttribute('height', `${this.height}px`);
        canvas.setAttribute('id', 'canvas');
        canvas.addEventListener('mousedown', ev => this.canvasDragStart(ev));
        canvas.addEventListener('mousemove', ev => this.canvasDrag(ev));
        canvas.addEventListener('mouseup', ev => this.canvasDragEnd(ev));
        this.context = canvas.getContext('2d');
        this.parentContainer.appendChild(canvas);
    }

    canvasDragStart(ev: MouseEvent) {
        console.log('canvasDragStart');
        let position = this.getPointFromMouse(ev);
        this.draggingPoint = this.findNearestPoint(position.x, position.y);
    }

    getPointFromMouse(ev: MouseEvent) {
        let bound = this.context.canvas.getBoundingClientRect()
        let canvasX = ev.clientX - bound.left;
        let canvasY = ev.clientY - bound.top;
        return new Point(canvasX, canvasY);
    }

    findNearestPoint(x: number, y: number) {
        if (this.checkPoint(x, y, this.startX, this.startY))
            return {x: 'startX', y: 'startY'}
        if (this.checkPoint(x, y, this.cx1, this.cy1))
            return {x: 'cx1', y: 'cy1'}
        if (this.checkPoint(x, y, this.cx2, this.cy2))
            return {x: 'cx2', y: 'cy2'}
        if (this.checkPoint(x, y, this.endX, this.endY))
            return {x: 'endX', y: 'endY'}
    }

    checkPoint(x1: number, y1: number, x2: number, y2: number) {
        return Math.abs(x1 - x2) < 10 &&
                Math.abs(y1 - y2) < 10
    }

    canvasDragEnd(ev) {
        this.draggingPoint = null;
    }

    canvasDrag(ev) {
        if (!this.draggingPoint) return;
        let point = this.getPointFromMouse(ev);
        this.form.updateValue(this.draggingPoint.x, point.x);
        this.form.updateValue(this.draggingPoint.y, point.y);
        this[this.draggingPoint.x] = point.x;
        this[this.draggingPoint.y] = point.y;
    }

    draw() {
        if (!this.context) return;
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.save();
        this.drawLine();
        this.drawStartEnd();
        this.drawCPs();
        this.context.restore();
        requestAnimationFrame(() => this.draw());
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
    private controls: Map<string, HTMLInputElement> = new Map();
    constructor(
        private listener: (controlId: string, newValue: string) => void,
    ) {

    }

    updateValue(id: string, value: number) {
        let input = this.controls.get(id);
        if (!input) return;
        input.value = value.toString();
    }

    html(): HTMLDivElement {
        let container = HTMLHelper.div('input-form');
        let width = this.inputGroup('Width', 'width-input', 'number', '500');
        let height = this.inputGroup('Height', 'height-input', 'number', '500');
        let group = this.inputGroupGroup(width, height);
        let widthHeightGroup = this.controlGroup('Canvas Size', group);
        container.appendChild(widthHeightGroup);
        let start = this.XYControlGroup('Start', 'startX', 'startY');
        container.appendChild(start);
        let control1 = this.XYControlGroup('Control Point 1', 'cx1', 'cy1');
        container.appendChild(control1);
        let control2 = this.XYControlGroup('Control Point 2', 'cx2', 'cy2');
        container.appendChild(control2);
        let end = this.XYControlGroup('End', 'endX', 'endY');
        container.appendChild(end);
        return container;
    }

    XYControlGroup(name: string, inputIdX: string, inputIdY: string) {
        let initialX = Math.floor(Math.random() * 500);
        let initialY = Math.floor(Math.random() * 500);

        let x = this.inputGroup('X', inputIdX, 'number', `${initialX}`);
        let y = this.inputGroup('Y', inputIdY, 'number', `${initialY}`);
        this.listener(inputIdX, `${initialX}`);
        this.listener(inputIdY, `${initialY}`);
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
        this.controls.set(inputId, input);
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