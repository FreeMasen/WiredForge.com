import { HTML, EventHandler, Logger } from '../services';
import { Post, Component, Attribute } from '../models';
import { BlogPost } from '../components';

export class PostController implements Component {
    private html = new HTML();
    private events = new EventHandler;

    private currentPage: number = 0;
    private paginatedPosts: Array<BlogPost[]> = [];
    private editable = false;

    private backButton: HTMLButtonElement;
    private forwardButton: HTMLButtonElement;

    node: HTMLElement;
    path: 'posts';

    private posts: HTMLElement;
    constructor(posts: Post[], editable: boolean = false) {
        Logger.log('PostController', 'constructor', posts, editable);
        this.editable = editable
        var blogPosts = this.constructPosts(posts);
        this.paginatedPosts = this.paginatePosts(blogPosts);
        this.posts = this.html.div(this.currentNodes(), new Attribute('id', 'posts-wrapper'));
        this.node = this.html.div([this.posts, this.footerToolbar()], new Attribute('id', 'post-controller'));
        this.updateButtons();
        // var mutObserver = new MutationObserver(this.clearEditEvents);
        // var observationOpts = {childList: true, subtree: true};
        // mutObserver.observe(this.node, observationOpts);
    }

    clearEditEvents(event): void {
        for (var i = 0; i < event.length; i++) {
            var trigger = event[i];
            for (var j = 0; j < trigger.removedNodes;j++) {
                var removedNode = trigger.removedNodes[j];
                this.events.clearEvent('click','#' + removedNode.id);
            }
        }
    }

    cleanUp(): void {
        var currentPosts = this.paginatedPosts[this.currentPage];
        for (var i = 0; i < currentPosts.length; i++) {
            currentPosts[i].cleanUp();
        }
    }

    pageForward(): void {
        Logger.log('PostController', 'pageForward', this.currentPage);
        if (this.currentPage < this.paginatedPosts.length) {
            this.currentPage++;
            this.fillNode(this.currentNodes());
            this.updatePageText();
        }
    }

    pageBackward(): void {
        Logger.log('PostController', 'pageBackward', this.currentPage);
        if (this.currentPage > 0) {
            this.currentPage--;
            this.fillNode(this.currentNodes());
            this.updatePageText();
        }
    }

    fillNode(nodes: HTMLElement[]): void {
        Logger.log('PostController', 'fillNode', nodes);
        this.updateButtons();
        this.html.clearChildren(this.posts);
        this.html.addContent(this.posts, nodes);
    }

    constructPosts(posts: Post[]): BlogPost[] {
        Logger.log('PostController', 'constructPosts', posts);
        var blogPosts = [];
        for (var i = 0; i < posts.length; i++) {
            blogPosts.push(new BlogPost(posts[i], this.editable));
        }
        return blogPosts;
    }

    paginatePosts(posts: BlogPost[]): Array<BlogPost[]> {
        Logger.log('PostController', 'paginatePosts', posts);
        var ret:Array<BlogPost[]> = [];
        if (posts.length < 1) ret.push([]);
        var currentPage: BlogPost[] = [];
        for (var i = 0; i < posts.length; i++) {
            currentPage.push(posts[i]);
            if (currentPage.length >= 10
                || i == posts.length - 1) {
                ret.push(currentPage.splice(0));
            }
        }
        return ret;
    }

    private currentNodes(): Array<HTMLElement> {
        if (this.paginatedPosts.length < 1) return;
        var currentPosts = this.paginatedPosts[this.currentPage];
        return currentPosts.map(element => {
            return element.node;
        });
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
        var pageLimit = this.paginatedPosts.length;
        if (pageLimit < 1) {
            pageLimit = 1;
        }
        return `${this.currentPage + 1} of ${pageLimit}`;
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

    makeEditable(): void {
        var currentPosts = this.paginatedPosts[this.currentPage];
        for (var i = 0; i < currentPosts.length; i++) {
            currentPosts[i].makeEditable();
        }
    }

    makeUneditable(): void {
        var currentPosts = this.paginatedPosts[this.currentPage];
        for (var i = 0; i < currentPosts.length; i++) {
            currentPosts[i].makeUneditable();
        }
    }
}