import { HTML } from '../services';
import { Component, Post, Attribute } from '../models';

export class PostForm {
    node: HTMLElement;
    html = new HTML();
    constructor(post?: Post) {
        var contents = [];
        var titleText = 'New Post';
        if (post) {
            titleText = 'Edit Post';
        }
        var title = this.title(titleText);
        this.node = this.html.div(title, new Attribute('id', 'form-container'));
        this.html.addContent(this.node, [this.form(post)]);
    }

    title(titleText: string): HTMLDivElement {
        var text = this.html.span(titleText, new Attribute('class', 'title-text'),
                                                new Attribute('id', 'form-title'));
        var container = this.html.div(text, new Attribute('class', 'title-container header'));
        return container;
    }

    form(post?: Post): HTMLFormElement {
        var button;
        var submitAtt = new Attribute('id', 'post-submit');
        var buttonType = new Attribute('type', 'button')
        if (post) {
            button = this.html.button('save', submitAtt), buttonType;
        } else {
            button = this.html.button('submit', submitAtt, buttonType);
        }
        
        return this.html.form(this.controls(post), button, new Attribute('id', 'post-form'));
    }

    controls(post?: Post): HTMLElement[] {
        var title = '';
        var author = '';
        var content = '';
        if (post) {
            title = post.title;
            author = post.author;
            content = post.content;
        }
        return [
            this.textbox('Title', title),
            this.textbox('Author', author),
            this.textArea('Post', content)
        ];
    }

    textbox(labelText: string, content?: string): HTMLDivElement {
        var idPrefix = labelText.trim().replace(' ', '-').toLowerCase();
        var lbl = this.html.label(labelText, new Attribute('for', idPrefix + '-input'));
        var input = this.html.input('text', '', new Attribute('id', idPrefix + '-input'));
        var container = this.html.div(lbl, new Attribute('id', idPrefix + '-group'),
                                            new Attribute('class', 'control-group'));
        this.html.addContent(container, [input]);
        if (content) {
            input.value = content;
        }
        return container;
    }

    textArea(labelText: string, content?: string): HTMLDivElement {
        var idPrefix = labelText.trim().replace(' ', '-').toLowerCase();
        var lbl = this.html.label(labelText, new Attribute('for', idPrefix + '-input'));
        var input = this.html.create<HTMLTextAreaElement>('textarea', new Attribute('id', idPrefix + '-input'));
        var container = this.html.div(lbl, new Attribute('id', idPrefix + '-group'),
                                            new Attribute('class', 'control-group'));
        this.html.addContent(container, [input]);
        if (content) {
            input.value = content;
        }
        return container;
    }

}