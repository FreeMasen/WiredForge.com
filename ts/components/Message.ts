import { Component, Attribute } from '../models';
import { HTML, Logger } from '../services';
export class Message implements Component {
    html = new HTML();
    node: HTMLElement;
    constructor(content: string, isError: boolean) {
        this.node = this.createSpan(content);
        if (isError) {
            this.html.addClass(this.node, 'error');
        }
    }

    createSpan(content: string): HTMLSpanElement {
        return this.html.span(content, new Attribute('class', 'message-text'));
    }
}