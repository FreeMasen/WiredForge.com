import { Component, Attribute } from '../models';
import { HTML, EventHandler, DataService, Logger } from '../services';

export class Login implements Component {
    node: HTMLElement;
    path = 'login';
    html = new HTML();
    events = new EventHandler();

    constructor() {
        var button = this.html.button('Login'
                                , new Attribute('id', 'login-submit')
                                , new Attribute('type', 'button'))
        this.events.registerNodeEvent(button, '#login-submit', 'click', this.loginButtonClicked, this);
        this.node = this.html.form(this.createControlList()
                                , button
                                , new Attribute('id', 'login-button'));
    }

    loginButtonClicked(event): void {
        this.events.fire('login-attempt');
    }

    createControlList(): HTMLElement[] {
        var username = this.html.input('text'
                                    , 'Username'
                                    , new Attribute('id', 'username'));
        var password = this.html.input('password'
                                    , 'Password'
                                    , new Attribute('id', 'password'));
        return [username, password];
    }
}