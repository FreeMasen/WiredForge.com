#!/bin/bash
echo 'pulling down changes'
git pull
echo 'finding pid'
ID=`ps ax | grep wiredforge | head -1 | cut -d ' ' -f 1`
echo 'Killing pid '$ID
sudo kill $ID
echo 'buiilding project'
cd ~/projects/wiredforge.com/server && cargo build --release
echo 'moving new bin'
cp ~/projects/wiredforge.com/server/target/release/server ~/projects/wiredforge.com/wiredforge
cd ~/projects/wiredforge.com
echo 'starting server'
nohup ./wiredforge > server.log &

