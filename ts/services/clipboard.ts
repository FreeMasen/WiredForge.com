export default class Clipboard {
    static copy(text) {
        if ((navigator as any).clipboard) {
            return newStuff(text)
        } else {
            return oldSchool(text);
        }
    }

}

function oldSchool(text) {
    console.log('oldSchool')
    return new Promise((r, x) => {
        let ta = document.createElement('textarea');
        ta.setAttribute('style', 'display: none;');
        ta.value = text;
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            var res = document.execCommand('copy');
            if (!res) {
                return x('execCommand returned false');
            }
        } catch (err) {
            return x(err.message);
        }
        document.body.removeChild(ta);
        r()
    });
}

function newStuff(text) {
    console.log('newStuff')
    return (navigator as any).clipboard.writeText(text);
}