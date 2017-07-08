import { Component } from '../models';
import { HTML } from '../services';
export class Nav {
    private static breadCrumbs: string[] = [];
    private static main: HTMLElement;
    private static component: Component
    private html = new HTML();

    constructor() {
        if (!Nav.main) {
            Nav.main = <HTMLElement>document.querySelector('main-content');
            if (!Nav.main) throw new Error('document must contain main#-content');
        }
    }

    update(newComponent: Component): void {
        Nav.component = newComponent;
        this.html.clearChildren(Nav.main);
        this.html.addContent(Nav.main, [newComponent.node]);
    }
}