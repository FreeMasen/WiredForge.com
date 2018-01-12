export default class Http {
    static async get<T = any>(url): Promise<T> {
        return new Promise<T>((resolve, reject) => {
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

    static async post<T = any>(url: string, body: string = ''): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.onreadystatechange = () => {
                if (xhr.readyState == xhr.DONE) {
                    try {
                        let res = JSON.parse(xhr.responseText);
                        resolve(res);
                    } catch (e) {
                        resolve(xhr.responseText as any);
                    }
                }
            }
            xhr.send(body);
        });
    }
}