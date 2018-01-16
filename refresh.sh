#!/bin/bash
cd "$(dirname "$0")"
git pull
#npm i
webpack --env prod
gutenberg build --base-url https://wiredforge.com

#cargo build --release & ~/projects/wiredforge.com/server/target/release/server &
