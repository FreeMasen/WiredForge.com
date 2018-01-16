#!/bin/bash
cd "$(dirname "$0")"
git pull
#npm i
webpack --env prod
gutenberg build

#cargo build --release & ~/projects/wiredforge.com/server/target/release/server &
