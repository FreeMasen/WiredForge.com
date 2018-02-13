import { Statement } from './models';
export default class Html {

    static clearElement(el: HTMLElement) {
        while (el.hasChildNodes()) {
            el.removeChild(el.firstElementChild);
        }
    }

    static queuedStatement(s: Statement, 
                            deleteHandler: (s: Statement) => void): HTMLDivElement {
        let ret = document.createElement('div') as HTMLDivElement;
        let del = document.createElement('button') as HTMLButtonElement;
        del.setAttribute('type', 'button');
        del.setAttribute('class', 'statement-button');
        let x = document.createTextNode('X');
        del.appendChild(x);
        del.addEventListener('click', ev => deleteHandler(s))
        let span = document.createElement('span') as HTMLSpanElement;
        let spanText = document.createTextNode(s.text);
        span.appendChild(spanText);
        let voiceInfo = document.createElement('span') as HTMLSpanElement;
        let voiceText = document.createTextNode(`${s.voiceName} (${s.voiceLang})`);
        voiceInfo.appendChild(voiceText);
        let topContainer = document.createElement('div') as HTMLDivElement;
        topContainer.setAttribute('class', 'queued-statement-top')
        topContainer.appendChild(voiceInfo);
        topContainer.appendChild(del);
        ret.appendChild(topContainer);
        ret.appendChild(span);
        return ret;
    }

    static completedStatement(s: Statement,
                            deleteHandler: (s: Statement) => void,
                            replayHandler: (s: Statement) => void): HTMLDivElement {
        let ret = Html.queuedStatement(s, deleteHandler);
        let lowerDiv = document.createElement('div') as HTMLDivElement;
        lowerDiv.setAttribute('class', 'completed-statement-data');
        let lastPlayedDiv = document.createElement('div') as HTMLDivElement;
        lastPlayedDiv.setAttribute('class', 'last-played');
        let title = document.createElement('span') as HTMLSpanElement;
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

    static dateString(dt: Date): string {
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
}
