+++
title = "Analytics Info"
render = true
template = "page.html"
date = 2019-02-05
draft = false
+++
In an effort to get some level of visibility in the traffic of my websites I collect a small amount of information about visitors. The exact code that does this can be found on [github](https://github.com/freemasen/analytics). I am going to try and provide a high level overview of what I am collecting, how I am collecting, why I am collecting, and how long I keep this information.

## What/How
First, lets go over the what and how. When a user lands on a page an HTTP request is sent immediately with following pieces of information.

- Referrer: This is where the link you clicked is hosted
  - This is captured from the `document.referrer` value
- Page: The current url of the page you are on
  - This is captured from `location.href`
- Cookie: This is a token tied to your browser and the current site you are on
  - This is captured from `localStorage.get('pizzalitics')`
- When: The time UTC you visited
  - This is captured from `moment.utc()`
- Previous Visit: If you previously visited this site, a token for that visit
  - This is capture from `localStorage.get('slice')`
- Site: The host of the page you are on e.g. this page's hose would be https://wiredforge.com
  - this is captured from `location.host`

In addition to the information I am explicitly including in the request, your browser also provides your current IP address which I capture to help detect unique visits.

The server responds to this request with the following.
- Token: This is the `cookie` value from the request
  - If no `cookie` was included in the request I check to see if your IP address has one already and send that
  - If no `cookie` exists for your IP address and one was not included in the request a new one is generated and saved
- Visit: This is a unique id for your current visit to this page, it will get stored as detailed above

When you leave any page a final request is sent with the following information
- Visit: The visit token provide above
  - This is obtained from localStorage
- Time: The time you have left
  - This is captured with `moment.utc()`
- Link Clicked: A link on this page you might have clicked to leave
  - This is captured through a click handler that is added to all `<a>` tags on the page, which simply pulls the `href` attribute off of the event target

## Why
It is nice to have a picture of what the traffic to my sites looks like. Initially I was using `nginx` logs. 
That is a bit tedious to try and figure out what exactly is going on since it will add an entry for every file requested by your browser. 
I really don't need something as intense as google analytics and also am not comfortable subjecting my readers to that kind of monitoring. Instead I thought I could capture a small amount of information when you land on a page and again when you leave. 

Once a week I send myself an email with (as of writing) 3 tables in it. They look like this.

<table style="border:1px solid black;border-collapse: collapse;margin-bottom: 10px;">
    <thead>
        <tr>
            <th style="border:1px solid black;font-weight:bold;">Referrer</th>
            <th style="border:1px solid black;font-weight:bold;">Count</th>
        </tr>
        <tr>
            <td style="border:1px solid black;">3</td>
            <td style="border:1px solid black;">http://old.reddit.com/r/rust/</td>
        </tr>
        <tr>
            <td style="border:1px solid black;">5</td>
            <td style="border:1px solid black;">https://this-week-in-rust.org/blog/2019/01/22/this-week-in-rust-270/</td>
        </tr>
    </thead>
    <tbody></tbody>
</table>
<table style="border:1px solid black;border-collapse: collapse;margin-bottom: 10px;">
    <thead>
        <tr>
            <th style="border:1px solid black;font-weight:bold;">Visit Count</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="border:1px solid black;">14</td>
        </tr>
    </tbody>
</table>
<table style="border:1px solid black;border-collapse: collapse;margin-bottom: 10px;">
    <thead>
        <tr>
            <th style="border:1px solid black;font-weight:bold;">Page</th>
            <th style="border:1px solid black;font-weight:bold;">View Count</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="border:1px solid black;">https://wiredforge.com/blog/</td>
            <td style="border:1px solid black;">8</td>
        </tr>
        <tr>
            <td style="border:1px solid black;">https://wiredforge.com/fun/index.html</td>
            <td style="border:1px solid black;">3</td>
        </tr>
    </tbody>
</table>

That is really all I care about, what is driving traffic to my site, how much unique traffic am I getting and what pages are currently the most popular. Most of the information I am collect is just a way for me to make sure I'm not counting someone more than once. 

## How Long
Each night at midnight, I purge the last 30 days of information. 

## Conclusion
Hopefully the above is enough to help you understand the what and why of my "analytics". If you have any concerns or questions please feel free to send an email to r \[at\] robertmasen.com.