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

    // parseCode(block: string): HTMLDivElement {
    //     var container = this.html.div(null, new Attribute('class', 'code-block'));

    //     var lines = block.split('\n');
    //     for (var i = 0; i < lines.length; i++) {
    //         var line = lines[i];
    //         if (line.indexOf('(') > -1) {
    //             this.html.addContent(container, [this.parseFunctionLine(line)]);
    //             continue;
    //         } 
    //         var span = this.html.span('', new Attribute('class', 'code-line'));
    //     }
    //     return container;
    // }

    // parseFunctionLine(func: string): HTMLSpanElement {
    //     var span = this.html.span('', new Attribute('class', 'code-line'));
    //     var openParenIndex = func.indexOf('(');
    //     var closeParenIndex = func.indexOf(')');

    // }

    // private keywords = [
    //     'function',
    //     'func',
    //     'fn',
    //     'class',
    //     'var',
    //     'let',
    //     'namespace'
    // ];
}