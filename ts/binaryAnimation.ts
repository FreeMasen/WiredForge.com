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
        this.context.strokeStyle = '#000';
        this.context.fillStyle = 'green';
        this.context.arc(360, 150, 75, DrawingService.degToRads(0), DrawingService.degToRads(200), true);
        this.context.fill();
        this.context.stroke();
    }
}