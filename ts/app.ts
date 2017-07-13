import { HTML, EventHandler, DataService, AuthService, Logger } from './services';
import { Nav, BlogPost, About, Login, Message, PostForm, PostController } from './components';
import { Post, Description, Attribute, Component } from './models';

import * as Fire from 'firebase';

var app;
window.addEventListener('DOMContentLoaded', function() {
    app = new App();
});

class App {
    private html = new HTML();
    private events: EventHandler = new EventHandler();
    private data: DataService;
    private auth: AuthService;
    private nav: Nav;
    private currentPage = 1;
    private currentComponent: Component | Component[];
    private ready = false;

    constructor() {
        var app = Fire.initializeApp({
            apiKey: "AIzaSyBs_NU6omBBiraB2y552Frmaqh1CNBBXE4",
            authDomain: "wired-forge.firebaseapp.com",
            databaseURL: "https://wired-forge.firebaseio.com"});
        this.nav = new Nav('Home', 'About');
        this.data = new DataService(app);
        this.auth = new AuthService(app);
        this.displayNav();
        this.registerAllEvents();
        if (this.auth.isLoggedIn) {
            this.addUser(false);
        } else {
            this.clearUser(false);
        }
    }

    /**
     * Register all initial events
     */
    registerAllEvents(): void {
        Logger.log('App', 'registerAllEvents');
        this.events.registerEvent('db-ready', this.displayPosts, this);
        this.events.registerSelectorEvent('#login', 'click', this.loginButtonClicked, this);
        this.events.registerSelectorEvent('#home-nav-link','click', this.displayPosts, this);
        this.events.registerSelectorEvent('#about-nav-link', 'click', this.displayAbout, this);
        this.events.registerEvent('user-logged-in', this.addUser, this);
        this.events.registerEvent('user-logged-out', this.clearUser, this);
        this.events.registerEvent('error', this.displayMessage, this);
        this.events.registerEvent('event-saved', this.editComplete, this);
        this.events.registerEvent('event-created', this.newPost, this);
        this.events.registerEvent('single', this.displaySinglePost, this);
        this.events.registerEvent('edit', this.displayPostForm, this);
        this.events.registerEvent('delete-post', this.deletePost, this);
        this.events.registerEvent('login-attempt', this.sendLoginRequest, this);
    }

    /**
     * Display the nav menu
     */
    displayNav() {
        Logger.log('App', 'displayNav');
        var main = document.getElementById('inner-wrapper');
        var wrapper = document.getElementById('wrapper');
        if (!main || !wrapper) return;
        if (this.auth.isLoggedIn) {
            this.nav.addItem('New');
        }
        wrapper.insertBefore(this.nav.node, main);
    }

    //Login
    /**
     * Display the login form
     */
    loginButtonClicked(event): void {
        Logger.log('App','displayLogin');
        if (event.target.innerHTML === 'Logout') {
            return this.auth.logout();
        }
        if (this.auth.isLoggedIn) {
            this.addUser(true);
            return;
        }
        this.currentComponent = new Login();
        this.fillMain(this.currentComponent.node);
    }

    /**
     * Event handler for login
     */
    addUser(message: boolean = true): void {
        Logger.log('App','addUser')
        var a = this.html.a('Logout', null, new Attribute('id', 'login'));
        this.html.swapNode('#login', a);
        this.events.clearEvent('click', '#login');
        this.events.registerNodeEvent(a, '#login', 'click', this.loginButtonClicked, this);

        if (this.currentComponent instanceof PostController === false)
            this.displayPosts();

        var controller = <PostController>(this.currentComponent);
        controller.makeEditable();
        if (message)
            this.displayMessage('Successfully logged in', false);

        if (this.nav.items.indexOf('New') === -1) {
            this.nav.addItem('New');
            this.events.registerSelectorEvent('#new-nav-link', 'click', this.displayPostForm, this);
        }
        this.events.registerSelectorEvent('#new-nav-link', 'click', this.displayPostForm, this);
    }

    /**
     * Event handler for logout
     */
    clearUser(message: boolean = true): void {
        Logger.log('App','clearUser')
        if (message)
            this.displayMessage('Successfuly logged out', false);
        var a = this.html.a('Login', null, new Attribute('id', 'login'));
        this.events.clearEvent('click', '#login');
        this.html.swapNode('#login', a);
        this.events.registerNodeEvent(a, '#login', 'click', this.loginButtonClicked, this);
        if (this.currentComponent instanceof PostController) {
            let component = <PostController>(this.currentComponent);
            component.makeUneditable();

        }
        if (this.nav.items.indexOf('New') > -1) {
            this.nav.removeItem('New');
        }
    }

    /**
     * Capture the usernae and password textbox data and attempt to login
     */
    sendLoginRequest(): void {
        Logger.log('App','sendLoginRequest');
        var username = <HTMLInputElement>(document.querySelector('#username'));
        var password = <HTMLInputElement>(document.querySelector('#password'));
        if (username == null) return;
        if (password == null) return;
        var usernameText = username.value;
        var passwordText = password.value;
        this.auth.login(usernameText, passwordText);
    }

    //Posts
    /**
     * Clear any content and display the posts components
     */
    displayPosts(event?): void {
        Logger.log('App', 'displayPosts', event);
        var target;
        if (event) target = event.target;
        else {
            target = document.getElementById('home-nav-link')
        }
        this.updateSelectedNavElement(target);
        this.currentComponent = new PostController(this.data.postElements, this.auth.isLoggedIn);
        this.fillMain(this.currentComponent.node);
    }

    displaySinglePost(id: string): void {
        var end = id.lastIndexOf('more-');
        if (end > -1) {
            id = id.substr(end + 'more-'.length);
        }
        var post = this.data.findPost(id);
        if (post === undefined) return this.displayMessage('Unable to find that post', true);
        this.currentComponent = new BlogPost(post, false, false);
        this.fillMain(this.currentComponent.node);
    }

    //About
    /**
     * Clear any content and display the About components
     */
    displayAbout(event): void {
        Logger.log('App','displayAbout')
        this.updateSelectedNavElement(event.target);
        var sections = this.data.aboutElements;
        var elements = [];
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            var about = new About(section.title, section.content)
            elements.push(about.node);
        }
        this.currentComponent = elements;
        this.fillMain(...elements);
    }

    /**
     * Display a message to the user
     * @param content The actual message
     * @param isError If it should be styled as an error
     */
    displayMessage(content: string, isError: boolean): void {
        Logger.log('App','displayMessage', content, isError);
        var msgContainer = document.getElementById('message-container');
        if (!msgContainer) return;
        var msg = new Message(content, isError);
        this.html.addContent(msgContainer, [msg.node], false);
        setTimeout(function() {
            msgContainer.removeChild(msg.node);
        }, 5000);
    }

    /**
     * Display the new post form
     * @param {string} id The HTML event object
     */
    displayPostForm(id?: string) {
        Logger.log('App', 'displayPostForm', id);
        if (typeof id !== 'string') {
            this.currentComponent = new PostForm();
        } else {
            var postToEdit = this.data.findPost(id);
            this.currentComponent = new PostForm(postToEdit);
        }
        this.fillMain(this.currentComponent.node);
    }

    editComplete(event): void {
        Logger.log('App', 'postEdited');
        if (this.currentComponent instanceof PostForm) {
            var form = <PostForm>(this.currentComponent);
            var result = this.currentComponent.result();
            this.data.updatePost(result, (err: Error) => {
                Logger.log('App', 'data.editComplete');
                if (err) return this.displayMessage(err.message, true);
                this.displayMessage('Updated post', false);
                this.displayPosts();
            });
        }
    }

    deletePost(id: string): void {
        Logger.log('App', 'deletePost', id);
        this.data.deletePost(id, err => {
            if (err) return this.displayMessage(err.message, true);
            this.displayMessage('Post deleted', false);
            this.displayPosts();
        });
    }

    newPost(event): void {
        Logger.log('App', 'newPost', event);
        if (this.currentComponent instanceof PostForm) {
            var form = <PostForm>(this.currentComponent);
            var result = this.currentComponent.result();
            this.data.addNewPost(result, (err: Error) => {
                if (err) return this.displayMessage(err.message, true);
                this.displayMessage('New post aded', false);
                this.displayPosts();
                document.scrollingElement.scrollTop = 0;
            });
        }
    }

    //Helpers
    /**
     * Fill the #main-content element with content
     * @param content List of HTML Elemnts to be displayed
     */
    fillMain(...content: HTMLElement[]): void {
        Logger.log('App','fillMain');
        var main = document.getElementById('main-content');
        if (main === null) return;
        this.html.clearChildren(main);
        this.html.addContent(main, content);
        if (document.body.scrollTo)
            document.body.scrollTo(0, 0);
    }

    /**
     * Apply the selected class to our current page
     * @param selected The element that was selected to trigger the event
     */
    updateSelectedNavElement(selected: HTMLElement) {
        var nav = document.getElementsByClassName('nav-item');
        for (var i = 0; i < nav.length;i++) {
            var button = nav[i];
            if (button.id === selected.id) {
                this.html.addClass(button.parentElement, 'selected');
            } else {
                this.html.removeClass(button.parentElement, 'selected');
            }
        }
    }
}