#!/bin/bash
echo 'pulling down changes'
git pull
echo 'buiilding project'
cd ~/projects/wiredforge.com/server && cargo build --release
echo 'finding pid'
ID=`ps ax -o pid,args | egrep "[w]iredforge" | head -1 | sed -e 's/^[ \t]*//' | cut -d ' ' -f 1`
echo 'Killing pid '$ID
kill $ID
echo 'moving new bin'
cp ~/projects/wiredforge.com/server/target/release/server ~/projects/wiredforge.com/wiredforge
cd ~/projects/wiredforge.com
echo 'starting server'
nohup ./wiredforge prod > server.log &
