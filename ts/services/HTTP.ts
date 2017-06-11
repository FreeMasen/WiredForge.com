export class HTTP {

    get(url: string, callback:Function) {
        this.send('GET', url, null, callback);

    }

    post(url: string, body: any, callback: Function) {
        this.send('GET', url, body, callback);
    }

    put(url: string, body: any, callback: Function) {
        this.send('PUT', url, body, callback);
    }

    delete(url: string, body: any, callback: Function) {
        this.send('DELETE', url, body, callback);
    }

    send(method: string, url: string, body: any, callback: Function) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (callback) {
            xhr.addEventListener('readystatechange', function(event: Event) {
                var target = <XMLHttpRequest>event.target;
                if (target.readyState === XMLHttpRequest.DONE) {
                    if (target.status > 200) {
                        return callback(target.statusText);
                    }
                    var response
                    try {
                        response = JSON.parse(target.responseText);
                        
                    } catch(e) {
                        response = target.responseText;
                    }
                    callback(null, response);
                }
            });
        }
        xhr.send();
    }
}