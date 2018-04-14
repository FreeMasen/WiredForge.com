#!/bin/bash
cd "$(dirname "$0")"
git pull
yarn install
./node_modules/.bin/webpack --env prod
gutenberg build --base-url=https://wiredforge.com
