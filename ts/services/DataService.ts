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
    private static _dbPosts = {};
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
                var post = new Post(unparsed.timeStamp, unparsed.title, unparsed.content, unparsed.author, element.key);
                DataService._dbPosts[element.key] = post;
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
        var list = [];
        var lastTimestamp: number;
        for (var k in DataService._dbPosts) {
            var post: Post = DataService._dbPosts[k];
            list.push(post);
            lastTimestamp = post.timeStamp;
        }
        return list.sort((lhs, rhs) => {
                return rhs.timeStamp - lhs.timeStamp;
            });
    }

    get aboutElements(): Description[] {
        return DataService._about;
    }

    findPost(fbKey: string): Post {
        var post = DataService._dbPosts[fbKey];
        if (!post) throw new Error('Key does not have a post');
        return new Post(post.id,
                        post.title,
                        post.content,
                        post.author,
                        post.fbKey);
    }

    checkForReady(): void {
        Logger.log('DataService', 'checkForReady', DataService._about, DataService._posts);
        if(DataService._about !== null && DataService._posts !== null) {
            this.events.fire('db-ready')
        }
    }

    addNewPost(post: Post, callback: (Error) => void) {
        Logger.log('DataService', 'addNewPost', post);
        var posts = this.db.ref('/posts');
        post.fbKey = null;
        posts.push(post, callback);
    }

    addNewAbout(desc: Description, callback: (Error) => void): void {
        Logger.log('DataService', 'addNewAbout', desc);
        var about = this.db.ref('/about');
        about.push(desc, callback);
    }

    updatePost(post: Post, callback: (Error) => void): void {
        Logger.log('Dataservice', 'updatePost', post);
        var posts = this.db.ref('/posts');
        posts.child(post.fbKey).update(post, callback);
    }

    private transform(post: Post) {
        return {
            title: post.title,
            author: post.author,
        }
    }
}