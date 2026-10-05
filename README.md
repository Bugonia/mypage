# Bugonia Personal Homepage

This repository contains a static personal homepage for GitHub Pages.

## Local Preview

```bash
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```

## Deployment

Publish this repository with GitHub Pages using:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

After GitHub Pages finishes publishing, the site is available at:

```text
https://bugonia.github.io/mypage/
```

## Update Content

- Edit `index.html` to change the text and links.
- Edit `styles.css` to adjust the visual design.
- Edit `script.js` for small browser interactions.
- Contact email: `21-zxq@sjtu.edu.cn`.

## Analytics

Page visits and outbound clicks are recorded with GoatCounter at
`bugonia.goatcounter.com`. Paper and recommended-link clicks use named events
defined by `data-goatcounter-click` attributes in `index.html`.

The popularity sort reads the public JSON counters. In GoatCounter, enable
**Settings → Allow adding visitor counts on your website** for this sort to use
the accumulated totals. Without that setting or before events have data, the
page keeps its original order.

GoatCounter's private dashboard contains aggregate location statistics. It
uses IP addresses to determine approximate locations but does not store the IP
addresses themselves.

The visitor map embeds GoatCounter's dashboard with `hideui=1`. For the frame
to load on GitHub Pages, add `bugonia.github.io` under **Settings → Sites that
can embed GoatCounter** and give the dashboard a public view mode. GoatCounter
continues to control the displayed date range and location data.
