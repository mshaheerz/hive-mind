```markdown
# incident-timeline-viewer

See outages in one scroll.  
A single-file web page that turns your incident JSON into a living timeline—no build tools, no servers, just open in a browser.

## Why?

Post-mortems are easier when everyone sees *what* happened *when*.  
Instead of reading rows in a spreadsheet or scrolling Slack, drop the data into this viewer and play the story back like a video.

## Quick Start (30 s)

1. Grab the latest release  
   ```bash
   curl -L -o timeline.html \
   https://github.com/<owner>/incident-timeline-viewer/releases/latest/download/timeline.html
   ```

2. Prepare your incidents as `incidents.json` in the same folder.  
   Minimal example:
   ```json
   [
     {
       "id": "srv-123",
       "title": "API timeout",
       "start": "2023-09-01T08:00:00Z",
       "end": "2023-09-01T10:30:00Z",
       "severity": "high"
     }
   ]
   ```

3. Double-click `timeline.html`.  
   Done—your timeline is on screen.

## Usage

### Keyboard
- `→` / `←` – step forward / back  
- `space` – play / pause  
- `home` – jump to start  
- `end` – jump to latest

### URL options
```
timeline.html?source=https://mycdn/incidents.json&autoplay=1&speed=2
```

| Param   | Meaning                     | Default |
|---------|-----------------------------|---------|
| source  | path or URL to JSON file    | incidents.json |
| autoplay| start playback on load      | 0 |
| speed   | playback multiplier        | 1 |

### Colors
Severity is mapped by name (case-insensitive):

| Severity | Color |
|----------|-------|
| low      | green |
| medium   | amber |
| high     | red   |
| critical | dark-red |

Add your own in the `<style>` block at the top of the file.

## Data Format

Each incident must have:
- `id` – unique string
- `title` – short description
- `start` – ISO-8601 timestamp
- `end` – ISO-8601 timestamp (can be in the future for ongoing)
- `severity` – string, see table above

Optional fields:
- `description` – longer text (shows on click)
- `tags` – array of strings (displayed as chips)

Example with optional fields:
```json
{
  "id": "db-001",
  "title": "DB replication lag",
  "description": "Master-slave lag >30 s caused 500s on /checkout",
  "start": "2023-09-01T12:00:00Z",
  "end": "2023-09-01T13:15:00Z",
  "severity": "high",
  "tags": ["database", "checkout"]
}
```

## Browser Support

Works in any modern browser with ES6 support (Chrome 61+, Edge 79+, Firefox 60+, Safari 11+).  
Zero dependencies, no cookies, no trackers—everything runs offline.

## Contributing

Found a bug or want a feature?  
Open an issue or send a PR. Keep changes inside the single HTML file so the project stays “copy-and-run”.

Local dev:
```bash
python -m http.server 8080   # or any static server
open http://localhost:8080/timeline.html
```

We use Prettier for HTML/CSS/JS formatting. A GitHub action will auto-format on push.

## License

MIT – do what you want, just don’t sue us.
```