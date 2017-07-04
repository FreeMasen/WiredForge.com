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

    constructor() {
        var app = Fire.initializeApp({
            apiKey: "AIzaSyBs_NU6omBBiraB2y552Frmaqh1CNBBXE4",
            authDomain: "wired-forge.firebaseapp.com",
            databaseURL: "https://wired-forge.firebaseio.com"});
        this.nav = new Nav('Home', 'About');
        this.displayNav();
        this.registerAllEvents();
        this.data = new DataService(app);
        this.auth = new AuthService(app);
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
        this.events.registerEvent('user-logged-in', this.userChange, this);
        this.events.registerEvent('user-logged-out', this.userChange, this);
        this.events.registerEvent('error', this.displayMessage, this);
        this.events.registerEvent('event-saved', this.editComplete, this);
        this.events.registerEvent('event-created', this.newPost, this);
    }

    /**
     * Display the nav menu
     */
    displayNav() {
        Logger.log('App', 'displayNav');
        var main = document.getElementById('inner-wrapper');
        var wrapper = document.getElementById('wrapper');
        if (!main || !wrapper) return;
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
        this.updateNav(event.target);
        if (this.auth.isLoggedIn) {
            this.addUser();
            return;
        }
        this.currentComponent = new Login();
        this.fillMain(this.currentComponent.node);
        this.events.registerSelectorEvent('#login-submit','click', this.sendLoginRequest, this);
    }

    /**
     * Event handler for a change in the user
     */
    userChange(): void {
        Logger.log('App','userChange', this.auth.isLoggedIn);
        if (this.auth.isLoggedIn) return this.addUser();
        this.clearUser();
    }

    /**
     * Event handler for login
     */
    addUser(): void {
        Logger.log('App','addUser')
        var a = this.html.a('Logout', null, new Attribute('id', 'login'));
        this.html.swapNode('#login', a);
        this.events.reRegister(a);
        var text = this.auth.isLoggedIn ? 'Logout' : 'Login';
        if (this.currentComponent instanceof PostController === false)
            this.displayPosts();

        this.displayMessage('Successfully logged in', false);
        this.nav.addItem('New');
        this.events.registerSelectorEvent('#new-nav-link', 'click', this.displayPostForm, this);
        this.events.registerSelectorEvent('.edit-button', 'click', this.displayPostForm, this);
    }

    /**
     * Event handler for logout
     */
    clearUser(): void {
        this.displayMessage('Successfuly logged out', false);
        Logger.log('App','clearUser')
        var text = this.auth.isLoggedIn ? 'Logout' : 'Login';
        var a = this.html.a(text, null, new Attribute('id', 'login'));
        this.html.swapNode('#login', a);
        this.events.reRegister(a);
        this.nav.removeItem('New');
        this.events.clearEvent('click', '.edit-button');
        var editButtons = document.querySelectorAll('.edit-button');
        for (var i = 0; i < editButtons.length; i++) {
            var button = editButtons[i];
            button.parentElement.removeChild(button);
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
        this.updateNav(target);
        this.currentComponent = new PostController(this.data.postElements, this.auth.isLoggedIn);
        this.fillMain(this.currentComponent.node);

        if (this.auth.isLoggedIn) {
        } else {
        }
    }

    //About
    /**
     * Cear any content and display the About components
     */
    displayAbout(event): void {
        Logger.log('App','displayAbout')
        this.updateNav(event.target);
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
     * @param event The HTML event object
     */
    displayPostForm(event: Event) {
        Logger.log('App', 'displayPostForm', event);
        var target = <HTMLElement>event.target;
        if (!target) return Logger.error('App', 'displayPostForm', new Error('No event.target'), event);
        this.updateNav(target);
        
        if (!this.auth.isLoggedIn) 
            return this.displayMessage('You are not authorized to add new content here, have you tried loggin in?', true);
        var post: PostForm;
        Logger.log('App', 'displayPostForm', target.innerHTML);
        if (target.innerHTML == 'edit') {
            var postToEdit = this.data.findPost(target.id);
            Logger.log('App', 'displayPostForm', 'found post', postToEdit);
            this.currentComponent = new PostForm(postToEdit);
        } else {
            this.currentComponent = new PostForm();
        }
        this.fillMain(this.currentComponent.node);
    }

    editComplete(event): void {
        Logger.log('App', 'postEdited');
        if (this.currentComponent instanceof PostForm) {
            var form = <PostForm>(this.currentComponent);
            var result = this.currentComponent.result();
            Logger.log('App', 'postEdited', result);
            this.data.updatePost(result, (err: Error) => {
                Logger.log('App', 'data.editComplete');
                if (err) return this.displayMessage(err.message, true);
                this.displayMessage('Updated post', false);
                this.displayPosts();
            });
        }
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
    }

    /**
     * Apply the selected class to our current page
     * @param selected The element that was selected to trigger the event
     */
    updateNav(selected: HTMLElement) {
        var nav = document.getElementsByClassName('nav-item');
        for (var i = 0; i < nav.length;i++) {
            var button = nav[i];
            if (button.isSameNode(selected)) {
                this.html.addClass(button.parentElement, 'selected');
            } else {
                this.html.removeClass(button.parentElement, 'selected');
            }
        }
    }
}