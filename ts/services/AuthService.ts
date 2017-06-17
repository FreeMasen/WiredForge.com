import * as Fire from 'firebase';
import {EventHandler} from './EventHandler';
import { Logger } from '../services';

export class AuthService {
    private auth: Fire.auth.Auth;
    private events: EventHandler;
    private static user;
    constructor(app: Fire.app.App) {
        this.events = new EventHandler();
        this.auth = Fire.auth(app);
        this.auth.onAuthStateChanged((user) => {
            Logger.log('AuthService', 'onAuthStateChanged', 'with user: ', user !== null);
            AuthService.user = user;
            if (user) {
                this.events.fire('user-logged-in');
            } else {
                this.events.fire('user-logged-out');
            }
        },(err) => {
            if (err) {
                return Logger.error('AuthService', 'onAuthStateChanged', err);
            }
        });
    }

    get isLoggedIn(): boolean {
        Logger.log('AuthService', 'isLoggedIn', this.auth.currentUser);
        return AuthService.user != null;
    }

    login(email, password) {
        Logger.log('AuthService', 'login');
        if (AuthService.user !== null) return;
        this.auth.signInWithEmailAndPassword(email, password)
                    .catch(err => {
                        Logger.error('AuthService', 'signInWithEmailAndPassword', err);
                    });
    }

    logout() {
        Logger.log('AuthService', 'logout')
        this.auth.signOut()
            .then(x => {
                Logger.log('AuthService', 'signOut', x);
            })
            .catch(err => {
                Logger.error('AuthService', 'signOut', err);
            });
    }

}