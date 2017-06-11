import { HTML, EventHandler, DataService, AuthService, Logger } from './services';
import { Nav, BlogPost, About, Login, Message, PostForm } from './components';
import { Post, Description, Attribute } from './models';

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
        // this.seed()
    }

    seed() {
        var newPost = new Post(new Date().getTime().toString(),
                                'Test Post Seed 2',
                                `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
                                'Seeder McSeed');
        var newDesc = new Description('About Wired Forge',
                                        `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`)
        this.data.addNewPost(newPost, (err: Error) => {
            if (err) return this.displayMessage(err.message, true);
        });
        this.data.addNewPost(newPost, (err: Error) => {
            if (err) return this.displayMessage(err.message, true);
        });
        // this.data.addNewAbout(newDesc, err => {
        //     if (err) return this.displayMessage(err.message, true);
        // })
    }

    registerAllEvents(): void {
        Logger.log('App', 'registerAllEvents');
        this.events.registerEvent('db-ready', this.displayPosts, this);
        this.events.registerHTMLEvent('#login', 'click', this.displayLogin, this);
        this.events.registerHTMLEvent('#home-nav-link','click', this.displayPosts, this);
        this.events.registerHTMLEvent('#about-nav-link', 'click', this.displayAbout, this);
        this.events.registerEvent('user-logged-in', this.userChange, this);
        this.events.registerEvent('user-logged-out', this.userChange, this);
        this.events.registerEvent('error', this.displayMessage, this);
    }

    displayNav() {
        Logger.log('App', 'displayNav');
        var main = document.getElementById('main-content');
        var wrapper = document.getElementById('wrapper');
        if (!main || !wrapper) return;
        wrapper.insertBefore(this.nav.node, main);
    }

    //Login
    /**
     * Display the login form
     */
    displayLogin(event): void {
        Logger.log('App','displayLogin');
        this.updateNav(event.target);
        if (this.auth.isLoggedIn) {
            this.addUser();
            return;
        }
        this.fillMain(new Login().node)
        this.events.registerHTMLEvent('#login-submit','click', this.sendLoginRequest, this);
    }

    userChange(): void {
        Logger.log('App','userChange');
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
        var text = this.auth.isLoggedIn ? 'Logout' : 'Login';
        this.events.removeListener('click', '#login', this.displayLogin)
        this.events.registerHTMLEvent('#login', 'click', this.clearUser, this);
        this.displayPosts();
        this.displayMessage('Successfully logged in', false);
        this.nav.addItem('New');
        this.events.registerHTMLEvent('#new-nav-link', 'click', this.displayPostForm, this);
    }

    /**
     * Event handler for logout
     */
    clearUser(): void {
        Logger.log('App','clearUser')
        var a = this.html.a('Login', null, new Attribute('id', 'login'));
        this.html.swapNode('#login', a);
        this.events.reRegister(a);
        this.auth.logout();
        this.nav.removeItem('New');
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
        var currentStart = (this.currentPage - 1) * 10;
        if (this.data.postElements === null) return;
        var posts = this.data.postElements.slice(currentStart, currentStart + 10);
        if (posts === null) return;
        let mainContent = document.getElementById('main-content');
        if (mainContent == null) return;

        var elements = [];
        for (var i = 0; i < posts.length; i++) {
            let post = posts[i];
            var bp = new BlogPost(post, this.auth.isLoggedIn);
            elements.push(bp.node);
        }
        this.fillMain(...elements);
        if (this.auth.isLoggedIn) {
            this.events.registerHTMLEvent('.edit-button', 'click', this.displayPostForm, this);
        } else {
            this.events.clearEvent('click', '.edit-button');
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
        Logger.log('App', 'displayNew', event);
        var target = <HTMLElement>event.target;
        if (!target) return;
        this.updateNav(target);
        
        if (!this.auth.isLoggedIn) 
            return this.displayMessage('You are not authorized to add new content here, have you tried loggin in?', true);
        var post: PostForm;
        if (target.innerHTML == 'edit') {
            return this.editPost(target.id);
        } else {
            post = new PostForm();
            this.fillMain(post.node);
        }
    }

    editPost(id: string): void {
        Logger.log('App', 'editPost', id);
        var post = this.data.findPosts(id);
        var p = new PostForm(post);
        this.fillMain(p.node);
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