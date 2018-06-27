+++
title = "Wasm Markdown Parser"
date = 2018-06-27
draft = true
tags = ["rust", "wasm", "markdown"]
[extra]
snippet = "A client side CommonMark parser"
image = "R_W.png"
image_desc = "Wasm CommonMark"
+++
<style>
    html,
    body {
        width: 100%;
        height: 100%;
        padding: 0;
        border: 0;
        margin: 0;
    }
    * {
        box-sizing: border-box;
    }

    #app-container {
        width: calc(100% - 20px);
        height: calc(100% - 20px);
        padding: 10px;
        background: slategray;
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: flex-start;
        align-content: flex-start;
    }
    #md-container,
    #html-container {
        width: calc(50% - 10px);
        height: 100%;
        padding: 0 5px;
    }
    #html-container {
        background: white;
    }
    #md-input-box {
        resize: none;
        width: 100%;
        height: 100%;
    }
</style>
<link href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css" rel="stylesheet" type="text/css" />
<div id="app-container">
    <div id="md-container">
        <textarea id="md-input-box"></textarea>
    </div>
    <div id="html-container" class="markdown-body">
        <div id="rendered"></div>
    </div>
</div>
<script src="js/wasmCMark.js"></script>