# Deploy

Build before upload:

```sh
npm run build:bump
```

Upload everything inside each market folder to its domain document root:

| Domain | Upload from |
|--------|-------------|
| Malaysia | `dist/my/` |
| Singapore | `dist/sg/` |
| Vietnam | `dist/vn/` |

Each folder contains `index.html`, `styles.css`, and `assets/`.

## CloudPanel / SFTP example

```sh
sftp USER@SERVER_IP
cd /home/USER/htdocs/DOMAIN
lcd dist/my
put index.html
put styles.css
mkdir assets
put -r assets/*
bye
```

Repeat with `lcd dist/sg` and `lcd dist/vn` for the other domains.

After copy or image changes, run `npm run build:bump` so browsers fetch fresh assets.
