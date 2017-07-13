import { Component, Attribute } from '../models';
import { HTML, Logger } from '../services';
export class Nav implements Component {
    node: HTMLElement;
    path = '';
    html = new HTML();
    items: string[] = [];

    constructor(...navList: string[]) {
        this.items = navList;
        this.node = this.html.nav(this.unorderedList(), new Attribute('id', 'main-nav'));
    }

    private unorderedList(): HTMLUListElement {
        var lis = [];
        for (var i = 0; i < this.items.length; i++) {
            lis.push(this.listItem(this.items[i]));
        }
        return this.html.ul(lis, new Attribute('id', 'nav-list'));
    }

    private listItem(content: string): HTMLLIElement {
        var id = content.trim().replace(' ', '-').toLowerCase();
        id += '-nav-link';
        var link = this.html.a(content, null, new Attribute('id', id),
                                                new Attribute('class', 'nav-item clickable'));
        return this.html.li(link, new Attribute('class', 'nav-item-box'));
    }

    addItem(content: string): void {
        Logger.log('Nav', 'addItem', content);
        this.items.push(content);
        if (!this.node.hasChildNodes()) return;
        var list = <HTMLUListElement>(this.node.firstChild);
        this.html.addContent(list, [this.listItem(content)]);
    }

    removeItem(content: string): void {
        Logger.log('Nav', 'removeItem', content);
        var id = content.trim().replace(' ', '-').toLowerCase();
        id += '-nav-link';
        var link = this.node.querySelector('#' + id);
        if (!link) return Logger.error('Nav', new Error('No nav element'), id);
        link.parentElement.parentElement.removeChild(link.parentElement);
        this.items = this.items.filter(item => {
            return item != 'New';
        });
    }
}