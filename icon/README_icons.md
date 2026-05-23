# Broke Runner — Icon Assets

Heartbeat waveform mark. Sky blue (#7DD3FC) on near-black (#0E0E10).

## Files included

### SVG sources (scalable, regenerate PNGs from these if needed)
- `icon.svg` — standard icon, full canvas, rounded corners (512×512 viewbox)
- `icon-maskable.svg` — same mark but scaled to ~78% to fit Android adaptive icon safe zone, no rounded corners (Android masks them)
- `favicon.svg` — smaller version with thinner stroke optimized for tiny sizes
- `apple-touch-icon.svg` — iOS variant, no rounded corners (iOS adds them itself)

### PNG outputs (ready for manifest)
- `icon-192.png` — PWA manifest, standard 192×192
- `icon-512.png` — PWA manifest, standard 512×512
- `icon-maskable-192.png` — PWA manifest, maskable 192×192 (Android adaptive icons)
- `icon-maskable-512.png` — PWA manifest, maskable 512×512
- `apple-touch-icon.png` — iOS home screen icon, 180×180
- `favicon-32.png` — browser tab favicon, 32×32
- `favicon-16.png` — browser tab favicon, 16×16

## Where these go in your project

Drop all files into `public/icons/` (or just `public/` for the favicons).

```
broke-runner/
└── public/
    ├── favicon.svg
    ├── favicon-16.png
    ├── favicon-32.png
    ├── apple-touch-icon.png
    └── icons/
        ├── icon.svg
        ├── icon-maskable.svg
        ├── icon-192.png
        ├── icon-512.png
        ├── icon-maskable-192.png
        └── icon-maskable-512.png
```

## Manifest configuration

In `vite.config.ts`, your `vite-plugin-pwa` config should reference these:

```ts
VitePWA({
  manifest: {
    name: 'Broke Runner',
    short_name: 'BrokeRunner',
    theme_color: '#0E0E10',
    background_color: '#0E0E10',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
})
```

In your `index.html` head:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#0E0E10" />
```

## Regenerating PNGs

If you tweak the SVG and want fresh PNGs, install `cairosvg` (Python) or use any SVG-to-PNG converter:

```bash
pip install cairosvg
python -c "import cairosvg; cairosvg.svg2png(url='icon.svg', write_to='icon-512.png', output_width=512, output_height=512)"
```

Or use the `sharp` Node.js library if you prefer staying in the JS ecosystem.

## Design tokens used

| Element | Value | Source |
|---|---|---|
| Background | `#0E0E10` | `--bg-base` |
| Pulse line | `#7DD3FC` | `--accent` |
| Standard corner radius | 22% of size | matches iOS rounded square |
| Stroke width | ~5.8% of size | scales proportionally |
