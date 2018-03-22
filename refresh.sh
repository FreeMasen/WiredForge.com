#!/bin/bash
cd "$(dirname "$0")"
git pull
npm set progress=false
npm i
npm set progress=true
webpack --env prod
gutenberg --config=config.prod.toml build