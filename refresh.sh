#!/bin/bash
cd "$(dirname "$0")"
git pull
npm set progress=false
npm i
npm set progress=true
webpack --env prod
gutenberg build --base_url=https://wiredforge.com