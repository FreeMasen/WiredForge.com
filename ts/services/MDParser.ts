import { HTML } from './HTML';
import { Attribute } from '../models';

/**
 * A service for parsing MarkDown to valid HTML
 */
export class MDParser {

    private html = new HTML();

    parseHeader(line: string): HTMLHeadingElement {
        var firstSpace = line.indexOf(' ');
        var levelHashes = line.substring(0, firstSpace).length;
        return this.html.h(levelHashes, line.substr(levelHashes));
    }

    parseImage(line: string, ...attributeList: Attribute[]): HTMLImageElement {
        let parts = line.split('](');
        let firstList = parts[0].split('|');
        var alt = firstList[1];
        var src = parts[1]
        src = src.substr(0, src.length - 2);
        return this.html.img(src, alt, ...attributeList);
    }

    parseLink(line: string): HTMLAnchorElement {
        var split = line.split('](');
        var linkText = split[0].substr(1);
        var href = split[1];
        href = href.substr(0, href.length - 1);
        return this.html.a(linkText, href);
    }
}