const fs = require('fs');
function addLogging(filename) {
    fs.readFile(filename, (err, data) => {
        if (err) return console.error('error reading file', err);
        if (typeof data != 'string') data = data.toString();
        let lines = data.split('\n');
        console.log('lines', lines.length);
        let outBound = [];
        for (let line of lines) {
            outBound.push(line)
            let parensIndex = line.indexOf('()');
            if (parensIndex > -1) {
                if (line[parensIndex + 2] == ';') continue;
                let start = line.substring(0, parensIndex);
                let spaceIndex = start.lastIndexOf(' ');
                let name = (start.substring(spaceIndex + 1));
                let endParensIndex = line.indexOf(')');
                if (endParensIndex < 0) continue;
                let args = [];
                // if (endParensIndex > parensIndex + 1) {
                //     let argString = line.substring(parensIndex, endParensIndex);
                //     args = argString.split(', ');
                // }
                let leadingSpace = '';
                for (var i = 0; i < start.length; i++) {
                    let char = start[i];
                    if (char == ' ' || char == '\t') {
                        leadingSpace += char;
                    } else {
                        break;
                    }
                }
                let newLine = `${leadingSpace}console.log('${name}', ${args.join(',')});`;
                outBound.push(newLine)
                
            }
        }
        fs.writeFileSync(filename, outBound.join('\n'));
    })
}


addLogging(process.argv[2]);