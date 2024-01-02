import { MoveDir } from "/js/pacman/enums.js";

export default class DrawingService {
    static degToRads(degrees) {
        return Math.PI / 180 * degrees;
    }

    static getStartMax(dir) {
        switch (dir) {
            case MoveDir.Up:
                return DrawingService.degToRads(315);
            case MoveDir.Right:
                return DrawingService.degToRads(45);
            case MoveDir.Down:
                return DrawingService.degToRads(135);
            case MoveDir.Left:
                return DrawingService.degToRads(225);
        }
    }

    static getDirCenter(dir) {
        switch(dir) {
            case MoveDir.Up:
                return DrawingService.degToRads(360);
            case MoveDir.Right:
                return DrawingService.degToRads(90);
            case MoveDir.Down:
                return DrawingService.degToRads(180);
            case MoveDir.Left:
                return DrawingService.degToRads(270);
        }
    }

    static getEndMax(dir) {
        switch(dir) {
            case MoveDir.Up:
                return DrawingService.degToRads(45);
            case MoveDir.Right:
                return DrawingService.degToRads(135);
            case MoveDir.Down:
                return DrawingService.degToRads(225);
            case MoveDir.Left:
                return DrawingService.degToRads(315);
        }
    }
}
