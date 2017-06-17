export class Post {
    constructor(
        public timeStamp: number,
        public title: string,
        public content: string,
        public author: string,
        public fbKey: string
    ) 
    {}
}