export default class Http {
    static async get(url) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onreadystatechange = () => {
                if (xhr.readyState == xhr.DONE) {
                    try {
                        let res = JSON.parse(xhr.responseText);
                        resolve(res);
                    } catch (e) {
                        resolve();
                    }
                }
            }
            xhr.send();
        });
    }

    static async post(url, body = '', contentType = null) {
        return new Promise<T>((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.onreadystatechange = () => {
                
                if (xhr.readyState == xhr.DONE) {
                    try {
                        let res = JSON.parse(xhr.responseText);
                        resolve(res);
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                }
            }
           if (contentType) {
               xhr.setRequestHeader('Content-Type', contentType);
           }
            xhr.send(body);
        });
    }
}
