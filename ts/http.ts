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

    static async post<T = any>(url: string, body: string = ''): Promise<T> {
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
            if (url.substr(url.indexOf('?')).length > 0)
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            else if (body != '')
                xhr.setRequestHeader('Content-Type', 'application/json');
            console.log('sending request');
            xhr.send(body);
        });
    }
}