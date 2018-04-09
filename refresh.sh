#!/bin/bash
cd "$(dirname "$0")"
git pull
yarn install
webpack --env prod
gutenberg build --base-url=https://wiredforge.com