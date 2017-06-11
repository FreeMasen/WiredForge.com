import * as Fire from 'firebase';
import { BlogPost, About } from '../components';
import { EventHandler, Logger } from '../services';
import { Post, Description } from '../models';

export class DataService {

    private db: Fire.database.Database;
    private static _gatheredPosts = false;
    private static _gatheredAbout = false;
    private static _posts: Post[] = null;
    private static _about: Description[] = null;
    private events = new EventHandler();

    constructor(app: Fire.app.App) {
        this.db = Fire.database(app);
        this.startListening();
    }

    private startListening(): void {
        Logger.log('DataService', 'startListening');
        var posts = this.db.ref('/posts');
        posts.on('value', snapshot => {
            var list = [];
            var counter = 0
            snapshot.forEach(element => {
                counter++;
                Logger.log('DataService', 'posts.value', counter);
                var unparsed = element.val();
                var post = new Post(unparsed.id, unparsed.title, unparsed.content, unparsed.author);
                list.push(post);
                return false;
            });
            DataService._posts = list;
            this.checkForReady();
        });
        var about = this.db.ref('/about');
        about.on('value', snapshot => {
            var list = [];
            snapshot.forEach(element => {
                var unparsed = element.val();
                var parsed = new Description(unparsed.title, unparsed.content);
                list.push(parsed);
                return false;
            });
            DataService._about = list;
            this.checkForReady();
        });
    }

    get postElements(): Post[] {
        return DataService._posts;
    }

    get aboutElements(): Description[] {
        return DataService._about;
    }

    findPosts(id: string): Post {
        var posts = this.db.ref('/posts');
        for (var i = 0; i < this.postElements.length; i++) {
            var post = this.postElements[i];
            if (post.id === id) return post;
        }
    }


    checkForReady(): void {
        Logger.log('DataService', 'checkForReady', DataService._about, DataService._posts);
        if(DataService._about !== null && DataService._posts !== null) {
            this.events.fire('db-ready')
        }
    }

    addNewPost(post: Post, callback: (Error) => void) {
        var posts = this.db.ref('/posts');
        posts.push(post, callback);
    }

    addNewAbout(desc: Description, callback: (Error) => void): void {
        var about = this.db.ref('/about');
        about.push(desc, callback);
    }
}