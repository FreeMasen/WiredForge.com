#!/bin/bash
cd "$(dirname "$0")"
git pull
npm set progress=false
npm i
npm set progress=true
webpack --env prod
gutenberg build --base-url=https://wiredforge.com