#!/bin/bash
cd "$(dirname "$0")"
git pull
npm install
./node_modules/.bin/webpack --env prod
zola build --base-url=https://wiredforge.com
