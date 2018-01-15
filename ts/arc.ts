///<reference path="./index.d.ts" />
import HTMLHelper from "./HtmlHelper";
import Point from './pacman/grid/Point';
import Style from './style';
import DrawingService from './pacman/services/drawingService';
let arc;

window.addEventListener('DOMContentLoaded',() => {
    let infoStr = localStorage.getItem('arcer')
    if (infoStr && infoStr.length > 0) {
        try {
        let info = JSON.parse(infoStr);
        arc = new Arcer(info.width, info.height,
                        info.startX, info.startY,
                        info.cx1, info.cy1,
                        info.cx2, info.cy2,
                        info.endX, info.endY);
        } catch (e) {
            localStorage.removeItem('arcer');
            arc = new Arcer();
        }
    } else {
        arc = new Arcer();
    }
});

class Arcer {
    private context: CanvasRenderingContext2D;
    private parentContainer: HTMLDivElement;
    private draggingPoint: {x: string, y: string};
    private form: BezForm;
    private arcParams: ArcParams;
    private arcToParams: ArcToParams;
    private formType: arcType = arcType.Bez;

    constructor(
        public width = 500,
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
        this.arcParams = new ArcParams(500, 500, 250, 250, 50, 0, 270, false);
        this.arcToParams = new ArcToParams(500, 500, 250, 10, 250, 250, 100, 100, 20);
        this.createForm();
        this.createCanvas();
        this.draw();
    }

    asJson(): BezParams {
        let ret: any;
        switch (this.formType) {
            case arcType.Bez:
                ret = new BezParams(
                    this.width, this.height, this.startX,
                    this.startY, this.cx1, this.cy1,
                    this.cx2, this.cy2, this.endX,
                    this.endY,
                ) as any;

            break;
            case arcType.ArcTo:

            break;
            case arcType.Arc:

            break;
        }
        ret.type = this.formType;
        return ret;
    }

    createForm() {
        this.form = new BezForm((id, value) => this.formUpdated(id, value),
                                this.asJson());
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
        this.store();
    }

    store() {
        localStorage.setItem('arcer', JSON.stringify(this.asJson()))
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
        let canvasX = Math.floor(ev.clientX - bound.left);
        let canvasY = Math.floor(ev.clientY - bound.top);
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
        this.store();
    }

    draw() {
        if (!this.context) return;
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.save();
        this.drawBezCurve();
        this.drawStartEnd();
        this.drawCPs();
        // this.drawArcTo();
        // this.drawArc();
        // let horizonatal = this.checkPoint(
        //                     this.arcParams.startPoint.x, 
        //                     this.arcParams.startPoint.y, 
        //                     this.arcParams.x + this.arcParams.radius, 
        //                     this.arcParams.y) &&
        //                     this.checkPoint(
        //                         this.arcParams.startPoint.x, 
        //                         this.arcParams.startPoint.y, 
        //                         this.arcParams.x, 
        //                         this.arcParams.y + this.arcParams.radius
        //                     );
        // this.drawRadius(this.arcParams.x, this.arcParams.y, this.arcParams.radius, horizonatal);
        // this.drawDot(this.arcParams.startPoint.x, this.arcParams.startPoint.y, Style.colors.indigo);
        // this.drawDot(this.arcParams.endPoint.x, this.arcParams.endPoint.y, Style.colors.black);
        this.context.restore();
        requestAnimationFrame(() => this.draw());
    }

    drawBezCurve() {
        this.context.beginPath();
        this.context.strokeStyle = Style.colors.grey;
        this.context.moveTo(this.startX, this.startY);
        this.context.bezierCurveTo(this.cx1, this.cy1, this.cx2, this.cy2, this.endX, this.endY);
        this.context.stroke();
        this.context.closePath();
    }

    drawArc() {
        this.context.beginPath();
        this.context.strokeStyle = Style.colors.grey;
        this.context.arc(this.arcParams.x, this.arcParams.y, this.arcParams.radius,
                        DrawingService.degToRads(this.arcParams.startDegrees),
                        DrawingService.degToRads(this.arcParams.endDegrees), 
                        this.arcParams.counterClockwise);
        this.context.stroke();
        this.context.closePath()
    }

    drawArcTo() {
        this.context.beginPath();
        this.context.strokeStyle = Style.colors.grey;
        this.context.moveTo(this.arcToParams.startX, this.arcToParams.startY);
        this.context.arcTo(this.arcToParams.x1,
                        this.arcToParams.y1,
                        this.arcToParams.x2,
                        this.arcToParams.y2,
                    this.arcToParams.radius)
        this.context.stroke();
        this.context.closePath();
        this.drawDot(this.arcToParams.startX, this.arcToParams.startY, Style.colors.green);
        this.drawDot(this.arcToParams.x1, this.arcToParams.y1, Style.colors.black);
        this.drawDot(this.arcToParams.x2, this.arcToParams.y2, Style.colors.orange);
        let radiusStartX = this.arcToParams.x1 - this.arcToParams.radius;
        let radiusStartY = this.arcToParams.y2 + this.arcToParams.radius;
        this.drawRadius(radiusStartX, radiusStartY, this.arcToParams.radius)
        
    }

    drawStartEnd() {
        this.drawDot(this.startX, this.startY, Style.colors.green);
        this.drawDot(this.endX, this.endY, Style.colors.red);
    }

    drawCPs() {
        this.drawDot(this.cx1, this.cy1, Style.colors.blue);
        this.drawDot(this.cx2, this.cy2, Style.colors.violet);
    }

    drawRadius(centerX: number, centerY: number, radius: number, horizontal = true) {
        this.context.beginPath();
        this.context.strokeStyle = Style.colors.green;
        this.context.moveTo(centerX, centerY);
        let x = horizontal ? centerX + radius : centerX;
        let y = horizontal ? centerY : centerY + radius;
        this.context.lineTo(x, y);
        this.context.stroke();
        this.context.closePath();
        this.drawDot(x, y, Style.colors.green);
        
    }

    drawDot(x: number, y: number, color: string) {
        this.context.beginPath();
        this.context.strokeStyle = 'none';
        this.context.fillStyle = Style.colors.white;
        this.context.ellipse(x, y, 4, 4, 0, 0, 360);
        this.context.fill();
        this.context.closePath();
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.ellipse(x, y, 4, 4, 0, 0, 360);
        this.context.closePath();
        this.context.fill();
    }
}

enum arcType {
    Bez,
    Arc,
    ArcTo
}

class ArcToParams {
    constructor(
        public height: number,
        public width: number,
        public startX: number,
        public startY: number,
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public radius
    ) {

    }
}

class ArcParams {
    constructor(
        public height: number = null,
        public width: number = null,
        public x: number = null,
        public y: number = null,
        public radius: number = null,
        public startDegrees: number = null,
        public endDegrees: number = null,
        public counterClockwise: boolean = false,
    ) {
        
    }

    get startPoint(): Point {
        return new Point(
            this.x + this.radius * Math.cos(DrawingService.degToRads(this.startDegrees)),
            this.y + this.radius * Math.sin(DrawingService.degToRads(this.startDegrees))
        );
    }

    get endPoint(): Point {
        return new Point(
            this.x + this.radius * Math.cos(DrawingService.degToRads(this.endDegrees)),
            this.y + this.radius * Math.sin(DrawingService.degToRads(this.endDegrees)),
        )
    }
}

class BezParams {
    constructor(
        public height: number,
        public width: number,
        public startX: number,
        public startY: number,
        public cx1: number,
        public cy1: number,
        public cx2: number,
        public cy2: number,
        public endX: number,
        public endY: number
    ) {

    }
}

class BezForm implements ArcerForm {
    public controls: Map<string, HTMLInputElement> = new Map();
    private maxHeight: number = 500;
    private maxWidth: number = 500;
    constructor(
        public listener: (controlId: string, newValue: string) => void,
        private initialValues: BezParams = null,
    ) {
        if (initialValues) {
            if (initialValues.height) this.maxHeight = initialValues.height;
            if (initialValues.width) this.maxWidth = initialValues.width;
        }
    }

    updateValue(id: string, value: number) {
        let input = this.controls.get(id);
        if (!input) return;
        input.value = value.toString();
    }

    html(): HTMLDivElement {
        let container = HTMLHelper.div('input-form');
        let width = this.inputGroup('Width', 'width-input', 'number', this.getInitialValue('height'));
        let height = this.inputGroup('Height', 'height-input', 'number', this.getInitialValue('width'));
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
        let initialX = this.getInitialValue(inputIdX);
        let initialY = this.getInitialValue(inputIdY);

        let x = this.inputGroup('X', inputIdX, 'number', `${initialX}`);
        let y = this.inputGroup('Y', inputIdY, 'number', `${initialY}`);
        this.listener(inputIdX, `${initialX}`);
        this.listener(inputIdY, `${initialY}`);
        let group = this.inputGroupGroup(x, y);
        return this.controlGroup(name, group);
    }

    getInitialValue(id: string) {
        if (this.initialValues && this.initialValues[id]) {
            return this.initialValues[id];
        }
        return Math.floor(Math.random() * this.maxHeight);
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

class ArcForm implements ArcerForm {
    controls = new Map<string, HTMLInputElement>();
    public maxHeight: number = 500;
    public maxWidth: number = 500;
    constructor(
        private initialValues: ArcParams = new ArcParams(),
        public listener: ListenerCallback
    ) {
        if (initialValues.height) this.maxHeight = initialValues.height;
        if (initialValues.width) this.maxWidth = initialValues.width
    }
    html(): HTMLDivElement {
        let container = HTMLHelper.div('input-form');
        let width = this.inputGroup('Width', 'width-input', 'number', this.getInitialValue('height'));
        let height = this.inputGroup('Height', 'height-input', 'number', this.getInitialValue('width'));
        let group = this.inputGroupGroup(width, height);
        let widthHeightGroup = this.controlGroup('Canvas Size', group);
        container.appendChild(widthHeightGroup);
        let center = this.XYControlGroup('Center', 'x', 'x');
        // let radius = this.controlGroup('Radius')
        
        return container;
    }

    getInitialValue(id, maxRandom?: number) {
        if (this.initialValues && this.initialValues[id]) {
            return this.initialValues[id];
        }
        return Math.floor(Math.random() * (maxRandom || this.maxHeight));
    }

    updateValue(id: string, value: number): void {
        let input = this.controls.get(id);
        if (!input) return;
        input.value = value.toString();
    }

    DegreesControlGroup(name: string, inputIdStart: string, inputIdEnd: string) {
        let initialStart = this.getInitialValue('startDegrees', 360);
        let initailEnd = this.getInitialValue('endDegrees', 360)
    }

    XYControlGroup(name: string, inputIdX: string, inputIdY: string) {
        let initialX = this.getInitialValue(inputIdX);
        let initialY = this.getInitialValue(inputIdY);
        let x = this.inputGroup('X', inputIdX, 'number', `${initialX}`);
        let y = this.inputGroup('Y', inputIdY, 'number', `${initialY}`);
        this.listener(inputIdX, `${initialX}`);
        this.listener(inputIdY, `${initialY}`);
        let group = this.inputGroupGroup(x, y);
        return this.controlGroup(name, group);
    }

    inputGroup(labelText: string, inputId: string,
                inputType: string,  initialValue: string): HTMLDivElement {
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