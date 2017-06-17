import { HTML, EventHandler, Logger } from '../services';
import { Post, Component, Attribute } from '../models';
import { BlogPost } from '../components';

export class PostController implements Component {
    private html = new HTML();
    private events = new EventHandler;
    private currentPage: number = 0;
    private paginatedPosts: Array<HTMLElement[]> = [];


    node: HTMLElement;
    constructor(posts: Post[], editable: boolean) {
        // debugger
        Logger.log('PostController', 'constructor', posts, editable);
        var blogPosts = this.constructPosts(posts, editable);
        this.paginatedPosts = this.paginatePosts(blogPosts);
        var nodes = this.html.div(this.paginatedPosts[this.currentPage], new Attribute('id', 'posts-wrapper'));
        this.node = this.html.div([nodes, this.footerToolbar()], new Attribute('id', 'post-controller'));
    }

    pageForward(): void {
        Logger.log('PostController', 'pageForward');
        if (this.currentPage < this.paginatedPosts.length) {
            this.currentPage++;
            this.fillNode(this.paginatedPosts[this.currentPage]);
        }
    }

    pageBackward(): void {
        Logger.log('PostController', 'pageBackward');
        if (this.currentPage > 0) {
            this.currentPage--;
            this.fillNode(this.paginatedPosts[this.currentPage])
        }
    }

    fillNode(nodes: HTMLElement[]): void {
        Logger.log('PostController', 'fillNode', nodes);
        this.html.clearChildren(this.node);
        this.html.addContent(this.node, nodes);
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
            if (currentPage.length >= 10) {
                ret.push(currentPage.splice(0));
            }
        }
        ret.push(currentPage.splice(0));
        return ret;
    }

    footerToolbar(): HTMLElement {
        Logger.log('PostController', 'footerToolbar');
        var leftIcon = this.html.i('chevron_left');
        var rightIcon = this.html.i('chevron_right');
        var leftButton = this.html.button(leftIcon, new Attribute('id', 'back-button'));
        var rightButton = this.html.button(rightIcon, new Attribute('id', 'forward-button'));
        this.events.registerNodeEvent(leftButton, '#back-button', 'click', this.pageBackward, this);
        this.events.registerNodeEvent(rightButton, '#forward-button', 'click', this.pageForward, this);
        var pageIndicator = this.html.span(this.pageText, new Attribute('id', 'page-indicator'));
        return this.html.div([leftButton, pageIndicator, rightButton], new Attribute('id', 'post-footer-toolbar'))
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
}