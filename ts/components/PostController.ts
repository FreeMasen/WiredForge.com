import { HTML, EventHandler, Logger } from '../services';
import { Post, Component, Attribute } from '../models';
import { BlogPost } from '../components';

export class PostController implements Component {
    private html = new HTML();
    private events = new EventHandler;

    private currentPage: number = 0;
    private paginatedPosts: Array<HTMLElement[]> = [];

    private backButton: HTMLButtonElement;
    private forwardButton: HTMLButtonElement;

    node: HTMLElement;

    private posts: HTMLElement;
    constructor(posts: Post[], editable: boolean) {
        Logger.log('PostController', 'constructor', posts, editable);
        var blogPosts = this.constructPosts(posts, editable);
        this.paginatedPosts = this.paginatePosts(blogPosts);
        this.posts = this.html.div(this.paginatedPosts[this.currentPage], new Attribute('id', 'posts-wrapper'));
        this.node = this.html.div([this.posts, this.footerToolbar()], new Attribute('id', 'post-controller'));
        this.updateButtons();
    }

    pageForward(): void {
        Logger.log('PostController', 'pageForward', this.currentPage);
        if (this.currentPage < this.paginatedPosts.length) {
            this.currentPage++;
            this.fillNode(this.paginatedPosts[this.currentPage]);
            this.updatePageText();
        }
    }

    pageBackward(): void {
        Logger.log('PostController', 'pageBackward', this.currentPage);
        if (this.currentPage > 0) {
            this.currentPage--;
            this.fillNode(this.paginatedPosts[this.currentPage]);
            this.updatePageText();
        }
    }

    fillNode(nodes: HTMLElement[]): void {
        Logger.log('PostController', 'fillNode', nodes);
        this.updateButtons();
        this.html.clearChildren(this.posts);
        this.html.addContent(this.posts, nodes);
    }

    constructPosts(posts: Post[], editable: boolean): BlogPost[] {
        Logger.log('PostController', 'constructPosts', posts, editable);
        var blogPosts = [];
        for (var i = 0; i < posts.length; i++) {
            blogPosts.push(new BlogPost(posts[i], editable));
        }
        return blogPosts;
    }

    paginatePosts(posts: BlogPost[]): Array<HTMLElement[]> {
        Logger.log('PostController', 'paginatePosts', posts);
        var ret:Array<HTMLElement[]> = [];
        var currentPage: HTMLElement[] = [];
        for (var i = 0; i < posts.length; i++) {
            currentPage.push(posts[i].node);
            if (currentPage.length >= 10
                || i == posts.length - 1) {
                ret.push(currentPage.splice(0));
            }
        }
        return ret;
    }

    footerToolbar(): HTMLElement {
        Logger.log('PostController', 'footerToolbar');
        var leftIcon = this.html.i('chevron_left');
        var rightIcon = this.html.i('chevron_right');
        this.backButton = this.html.button(leftIcon, new Attribute('id', 'back-button'),
                                                    new Attribute('class', 'pagination-button'));
        this.forwardButton = this.html.button(rightIcon, new Attribute('id', 'forward-button'),
                                                        new Attribute('class', 'pagination-button'));
        this.events.registerNodeEvent(this.backButton, '#back-button', 'click', this.pageBackward, this);
        this.events.registerNodeEvent(this.forwardButton, '#forward-button', 'click', this.pageForward, this);
        var pageIndicator = this.html.span(this.pageText, new Attribute('id', 'page-indicator'));
        return this.html.div([this.backButton, pageIndicator, this.forwardButton], new Attribute('id', 'post-footer-toolbar'))
    }

    updatePageText(): void {
        Logger.log('PostController', 'updatePageText');
        var pageSpan = this.html.span(this.pageText, new Attribute('id', 'page-indicator'));
        this.html.swapNode('#page-indicator', pageSpan);
    }

    get pageText(): string {
        Logger.log('PostController', 'pageText');
        return `${this.currentPage + 1} of ${this.paginatedPosts.length}`;
    }

    updateButtons(): void {
        if (this.currentPage === 0) {
            this.backButton.disabled = true;
        } else {
            this.backButton.disabled = false;
        }
        if (this.currentPage + 1 >= this.paginatedPosts.length) {
            this.forwardButton.disabled = true;
        } else {
            this.forwardButton.disabled = false;
        }
    }
}