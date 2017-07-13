import { Component, Attribute, Post }  from '../models';
import { HTML, MDParser, Logger, EventHandler } from '../services';

export class BlogPost implements Component {
    node: HTMLElement
    path: 'post/'
    edit: HTMLElement;

    private html = new HTML();
    private md = new MDParser();
    private events = new EventHandler();

    constructor(post:Post, editable: boolean = false, isInList: boolean = true) {
        let header = this.header(post.title, post.author, post.fbKey, editable);
        this.path += post.fbKey;
        this.node = this.html.div(header,
            new Attribute('class', 'blog-post'));
        if (isInList) {
            let snippet = this.snippet(post.content, post.fbKey);
            this.html.addContent(this.node, [snippet]);
        } else {
            let c = this.content(post.content);
            this.html.addContent(this.node, [c]);
        }
    }

    header(title: string, author: string, id: string, editable: boolean): HTMLElement {
        let subHeader = this.html.span(author, 
            new Attribute('class', 'sub-header'));
        let t = this.title(title, id, editable);
        let container = this.html.div(t, 
            new Attribute('class', 'header'));
        this.html.addContent(container, [subHeader]);
        return container;
    }

    title(title: string, id: string, editable: boolean): HTMLElement {
        let text = this.html.span(title, 
            new Attribute('class', 'title-text'))
        var container = this.html.div(text,
            new Attribute('class', 'title-container'));
        this.edit = this.html.button('edit', new Attribute('id', id),
                                            new Attribute('class', 'edit-button'));
        if (editable) {
            this.makeEditable(container);
        }
        return container;
    }

    editClicked(event): void {
        this.events.fire('edit', event.currentTarget.id);
    }

    moreClicked(event): void {
        this.events.fire('single', event.currentTarget.id);
    }

    makeEditable(container?: HTMLDivElement): void {
        Logger.log('BlogPost', 'makeEditable');
        if (container === undefined) container = <HTMLDivElement>(this.node.querySelector('.title-container'));
        this.html.addContent(container, [this.edit]);
        this.events.clearEvent('click', '#' + this.edit.id);
        this.events.registerNodeEvent(this.edit, '#' + this.edit.id, 'click', this.editClicked, this);
    }

    makeUneditable(): void {
        if (this.edit === undefined) return Logger.error('BlogPost', 'makeUneditable', new Error('edit button undefined'), this.path);
        this.edit.parentElement.removeChild(this.edit);
        this.events.clearEvent('click', '#' + this.edit.id);
    }

    content(content: string): HTMLElement {
        let container = this.html.div(null, 
            new Attribute('class', 'content'));
        var formattedContent = this.formatContent(content);

        return this.html.addContent(container, this.formatContent(content));
    }

    snippet(content: string, id: string): HTMLElement {
        //break the paragraphs into an array
        var paragraphs = content.split('\n');
        //if we have 0 or 1 paragraphs, don't limit the post
        if (paragraphs.length < 2) {
            return this.content(content);
        }
        //The total number of letters
        var total = 0;
        //The number of paragraphs to add
        var numberOfParagraphs = 0;
        //loop while the total is less than 250 characters
        while (total < 250 && numberOfParagraphs < paragraphs.length) {
            //Add the length of the current paragraph
            total += paragraphs[numberOfParagraphs].length;
            //increment the number of paragraphs we have captured
            numberOfParagraphs++;
        }
        //create the main container
        var container = this.content(paragraphs.slice(0, numberOfParagraphs).join('\n'));
        //create the more button
        var moreId = 'more-' + id;
        var more = this.html.button('more...', new Attribute('class', 'more-button'),
                                                new Attribute('id', moreId));
        this.events.registerNodeEvent(more, '#' + moreId, 'click', this.moreClicked, this);
        //Add the more button to the container
        this.html.addContent(container, [more]);
        return container;
    }

    private formatContent(content: string): HTMLElement[] {
        // if (!content) return;
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