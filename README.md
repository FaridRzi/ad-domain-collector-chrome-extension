# Ad Domain Collector
A simple personalized Chrome extension to capture all of the ad servers in a webpage. The output can be used in a service like pi-hole to block ad servers on a network.

Made using Calude

## Install
1. Unzip this folder somewhere permanent.
2. Open chrome://extensions and turn on Developer mode.
3. Click "Load unpacked" and select the `ad-domain-collector` folder.

## Use
1. Reload the page you want to inspect, scroll through it, wait a few seconds.
2. Click the extension icon, review the ticked domains, click "Copy selected".
3. Add them in Pi-hole (v6: `pihole deny <paste>`).

## Notes
- "Known" means an exact match in the StevenBlack hosts list, downloaded from GitHub (cached 24 h).
- It needs access to all sites to see their requests. Captured domains stay in your browser session.
- Requests made by a site's service worker are not attributed to a tab, so they are not listed.
- If your Pi-hole already uses the StevenBlack list, the known domains are already blocked there;
  look at "Other third-party domains" for new ones.
