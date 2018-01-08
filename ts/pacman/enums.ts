export enum MoveDir {
    Up,
    Down,
    Left,
    Right
}

export enum CellWall {
    Top = 1,
    Left = 2,
    Bottom = 4,
    Right = 8,
}

export enum CellCorner {
    TopLeft = 1,
    TopRight = 2,
    BottomLeft = 4,
    BottomRight = 8
}