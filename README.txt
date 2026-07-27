SCOOP MASTER TYCOON — PWA

How to test locally:
1. Do not open index.html directly from Files; service workers require a web server.
2. In this folder, run:
   python3 -m http.server 8000
3. Open http://localhost:8000

How to publish:
- Upload the entire folder to Netlify, Vercel, GitHub Pages, or Cloudflare Pages.
- The host must use HTTPS for installation and offline support.

Install on iPhone/iPad:
1. Open the published website in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch Scoop Master from the new icon.

Included:
- Offline support
- Installable manifest
- Apple touch icon
- Automatic local saves
- Automatic pause when the app is backgrounded
- Hidden developer sequence: Chocolate, Chocolate, Vanilla, Strawberry

Phone layout v3:
- Strict 100% iPhone viewport width
- Five compact top statistics in one row
- Three-column flavour grid without horizontal overflow
- Compact shop/statistics cards
- Cache-busted CSS and JavaScript filenames
- New service-worker cache version
