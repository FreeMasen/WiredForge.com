import { HTML, EventHandler } from '../services';
import { Component, Post, Attribute } from '../models';

export class PostForm {
    node: HTMLElement;
    path = 'post/edit/';
    submitButton: HTMLElement;
    html = new HTML();
    timeStamp: number;
    postKey: string;
    events: EventHandler;

    constructor(post?: Post) {
        this.events = new EventHandler();
        var contents = [];
        var titleText = 'New Post';
        if (post) {
            this.path += post.fbKey;
            titleText = 'Edit Post';
            this.postKey = post.fbKey;
        }
        if (!post || !post.timeStamp) this.timeStamp = new Date().getTime();
        var title = this.title(titleText, this.postKey);
        this.node = this.html.div(title, new Attribute('id', 'form-container'));
        var form = this.form(post);
        this.html.addContent(this.node, [form]);
    }

    private title(titleText: string, id?: string): HTMLDivElement {
        var text = this.html.span(titleText, new Attribute('class', 'title-text'),
                                                new Attribute('id', 'form-title'));
        var container = this.html.div(text, new Attribute('class', 'title-container header'));
        if (id) {
            var delId = 'delete-' + id;
            var del = this.html.button('delete', new Attribute('id', delId),
                                                    new Attribute('class', 'delete-button'));
            this.events.registerNodeEvent(del, '#' + delId, 'click', this.deletePost, this);
            this.html.addContent(container, [del]);
        }
        return container;
    }

    private deletePost(): void {
        this.events.fire('delete-post', this.postKey);
    }

    private form(post?: Post): HTMLFormElement {
        var button: HTMLButtonElement;
        var submitAtt = new Attribute('id', 'post-submit');
        var buttonType = new Attribute('type', 'button')
        if (post) {
            button = this.html.button('save', submitAtt, buttonType);
            button.addEventListener('click', function(event) {
                new EventHandler().fire('event-saved');
            });
        } else {
            button = this.html.button('submit', submitAtt, buttonType);
            button.addEventListener('click', function(event) {
                new EventHandler().fire('event-created');
            });
        }
        return this.html.form(this.controls(post), button, new Attribute('id', 'post-form'));
    }

    private controls(post?: Post): HTMLElement[] {
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

    private textbox(labelText: string, content?: string): HTMLDivElement {
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

    private textArea(labelText: string, content?: string): HTMLDivElement {
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

    result(): Post {
        var titleInput = <HTMLInputElement>(this.node.querySelector('#title-input'));
        var authorInput = <HTMLInputElement>(this.node.querySelector('#author-input'));
        var postInput = <HTMLInputElement>(this.node.querySelector('#post-input'));
        if (!titleInput || !authorInput || !postInput) return;
        return new Post(this.timeStamp, titleInput.value, postInput.value, authorInput.value, this.postKey);
    }
}