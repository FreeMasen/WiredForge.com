import { Statement } from '/js/voice/models.js';
export default class Html {

    static clearElement(el) {
        while (el.firstElementChild) {
            el.removeChild(el.firstElementChild);
        }
    }

    static queuedStatement(s, 
                            deleteHandler) {
        let ret = document.createElement('div');
        ret.setAttribute('class', 'queued statement');
        let del = document.createElement('button');
        del.setAttribute('type', 'button');
        del.setAttribute('class', 'delete statement-button');
        let x = document.createTextNode('X');
        del.appendChild(x);
        del.addEventListener('click', ev => deleteHandler(s))
        let span = document.createElement('span');
        let spanText = document.createTextNode(s.text);
        span.appendChild(spanText);
        let voiceInfo = document.createElement('span');
        let voiceText = document.createTextNode(`${s.voiceName} (${s.voiceLang})`);
        voiceInfo.appendChild(voiceText);
        let voiceContainer = document.createElement('div');
        voiceContainer.setAttribute('class', 'voice-info')
        let voiceTitle = document.createElement('span');
        voiceTitle.setAttribute('class', 'voice-title');
        let vTitleText = document.createTextNode('Voice');
        voiceTitle.appendChild(vTitleText);
        voiceContainer.appendChild(voiceTitle);
        voiceContainer.appendChild(voiceInfo);
        ret.appendChild(del);
        ret.appendChild(voiceContainer);
        ret.appendChild(span);
        return ret;
    }

    static completedStatement(s,
                            deleteHandler,
                            replayHandler) {
        let ret = Html.queuedStatement(s, deleteHandler);
        ret.setAttribute('class', 'completed statement');
        let lowerDiv = document.createElement('div');
        lowerDiv.setAttribute('class', 'completed-statement-data');
        let lastPlayedDiv = document.createElement('div');
        lastPlayedDiv.setAttribute('class', 'last-played');
        let title = document.createElement('span');
        title.setAttribute('class', 'last-played-title');
        let titleText = document.createTextNode('Last Played');
        title.appendChild(titleText);
        lastPlayedDiv.appendChild(title);
        let lastPlayed = document.createElement('span');
        lastPlayed.setAttribute('class', 'last-played-value');
        if (s.lastSpoken)
            lastPlayed.appendChild(document.createTextNode(this.dateString(s.lastSpoken)));
        let playAgain = document.createElement('button');
        playAgain.setAttribute('class', 'play-again-button');
        playAgain.addEventListener('click', ev => replayHandler(s));
        playAgain.appendChild(document.createTextNode('►'));
        lowerDiv.appendChild(lastPlayedDiv);
        lowerDiv.appendChild(playAgain);
        return ret;
    }

    static dateString(dt) {
        let month = dt.getMonth() + 1;
        let day = dt.getDate();
        let year = dt.getFullYear();
        let hour = dt.getHours();
        let t = 'AM'
        if (hour >= 12) {
            hour -= 12;
            t = 'PM';
        }
        if (hour == 0) {
            hour = 12;
        }
        dt.setHours(dt.getHours() + 1)
        let minute = dt.getMinutes();

        return `${month}/${day}/${year.toString().substr(2)} ${hour}:${minute} ${t}`;
    }

    static addClass(selector, className) {
        let el = Html.getElement(selector);
        if (!el) return;
        let classList = (el.getAttribute('class') || '').split(' ');
        classList.push(className);
        el.setAttribute('class', classList.join(' ')); 
    }

    static removeClass(selector, className) {
        let el = Html.getElement(selector);
        if (!el) return;
        let classList = (el.getAttribute('class') || '').split(' ');
        let index = classList.indexOf('className');
        if (index < 0) return;
        classList.splice(index, 1);
        el.setAttribute('class', classList.join(' '));
    }

    static getElement(selector) {
        return document.querySelector(selector);
    }

}
