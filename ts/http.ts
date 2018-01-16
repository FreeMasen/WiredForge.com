export default class Http {
    static async get<T = any>(url): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onreadystatechange = () => {
                if (xhr.readyState == xhr.DONE) {
                    console.log('got response', xhr.responseText)
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

    static async post<T = any>(url: string, body: string = '', contentType: string = null): Promise<T> {
        console.log('http.post', url, body);
        return new Promise<T>((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.onreadystatechange = () => {
                
                if (xhr.readyState == xhr.DONE) {
                    console.log('Response received', xhr.responseText)
                    try {
                        let res = JSON.parse(xhr.responseText);
                        console.log('parsed to json');
                        resolve(res);
                    } catch (e) {
                        console.log('failed to parse', xhr.responseText);
                        resolve(xhr.responseText as any);
                    }
                }
            }
           if (contentType) {
               xhr.setRequestHeader('Content-Type', contentType);
           }
            console.log('sending request');
            xhr.send(body);
        });
    }
}