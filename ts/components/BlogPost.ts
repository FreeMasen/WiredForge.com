import { Component, Attribute, Post }  from '../models';
import { HTML, MDParser, Logger } from '../services';

export class BlogPost implements Component {
    node: HTMLElement 
    edit: HTMLElement;
    html = new HTML();
    md = new MDParser();
    constructor(post:Post, editable: boolean = false) {
        let header = this.header(post.title, post.author, post.id, editable);
        this.node = this.html.div(header,
            new Attribute('class', 'blog-post'));
        let c = this.content(post.content);
        this.html.addContent(this.node, [c]);
    }

    header(title: string, author: string, id: string, editable: boolean): HTMLElement {
        let subHeader = this.html.span(author, 
            new Attribute('class', 'sub-header'));
        let t = this.title(title);
        let container = this.html.div(t, 
            new Attribute('class', 'header'));
        this.html.addContent(container, [subHeader]);
        if (editable && id !==null) {
            this.edit = this.html.button('edit', new Attribute('id', id),
                                                new Attribute('class', 'edit-button'));
            this.html.addContent(container, [this.edit]);
        }
        return container;
    }

    title(title: string): HTMLElement {
        let text = this.html.span(title, 
            new Attribute('class', 'title-text'))
        return this.html.div(text,
            new Attribute('class', 'title-container'));
    }

    content(content: string): HTMLElement {
        let container = this.html.div(null, 
            new Attribute('class', 'content'));
        return this.html.addContent(container, this.formatContent(content));
    }

    private formatContent(content: string): HTMLElement[] {
        if (!content) return;
        var split = content.split('\n');
        return split.filter(line => {
            return line.trim().length > 0;
        }).map(paragraph => {
            return this.formatParagraph(paragraph);
        });
    }

    private formatParagraph(paragraph: string): HTMLElement {
        if (paragraph.indexOf('](') > -1) {
            if (paragraph.indexOf('![')) {
                return this.md.parseImage(paragraph);
            } else {
                return this.md.parseLink(paragraph);
            }
        }
        return this.html.span(paragraph, new Attribute('class', 'paragraph'));
    }
}