import { Component, Attribute } from '../models';
import { HTML, EventHandler, DataService, Logger } from '../services';

export class Login implements Component {
    node: HTMLElement;
    html = new HTML();

    constructor() {
       this.node = this.html.form(this.createControlList()
                                , this.html.button('Login'
                                , new Attribute('id', 'login-submit')
                                , new Attribute('type', 'button'))
                                , new Attribute('id', 'login-button'));
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