import DrawingService from './pacman/services/drawingService';
let ba;
window.addEventListener('DOMContentLoaded', () => {
    ba = new BinaryAnimation();
});

class BinaryAnimation {
    private context: CanvasRenderingContext2D;
    constructor() {
        let canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.context = canvas.getContext('2d');
        window.requestAnimationFrame(() => this.render());
    }

    render() {
        this.renderBackground();
        this.renderDino();
        window.requestAnimationFrame(() => this.render());
    }

    renderBackground() {
        this.context.save();
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, 500, 500);
    }

    renderDino() {
        this.context.save();
        this.context.beginPath();
        this.context.fillStyle = 'green';
        this.context.arc(360, 150, 75, DrawingService.degToRads(0), DrawingService.degToRads(200), true);
        this.context.bezierCurveTo(250, 200, 200, 140, 250, 200);
        this.context.arc(230, 220, 50, DrawingService.degToRads(270), DrawingService.degToRads(1200), true);
        this.context.bezierCurveTo(240, 260, 240, 250, 240, 250)
        this.context.bezierCurveTo(235, 245, 230, 270, 220, 270);
        this.context.bezierCurveTo(440, 250, 290, 380, 320, 400);
        this.context.bezierCurveTo(260, 450, 400, 450, 300, 500);
        this.context.lineTo(450, 500);
        this.context.fill();
        this.context.restore();
    }
}