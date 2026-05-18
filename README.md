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

Pushing to `main` runs the GitHub Pages workflow in `.github/workflows/pages.yml`.

After the workflow finishes, the site is available at:

```text
https://bugonia.github.io/mypage/
```

## Update Content

- Edit `index.html` to change the text and links.
- Edit `styles.css` to adjust the visual design.
- Edit `script.js` for small browser interactions.
