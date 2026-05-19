# Static Deployment Notes

## Local build

Download the Tailwind standalone executable into this folder as `tailwindcss`, then run:

```bash
./tailwindcss -i input.css -o output.css --minify
```

## CloudPanel upload

Create one Static Site in CloudPanel for each domain. Upload the matching `index.html`, the shared `output.css`, and the shared `assets/` folder into each domain's document root.

Example SFTP commands:

```bash
sftp USER@SERVER_IP
cd /home/USER/htdocs/DOMAIN
put MY/index.html index.html
put output.css output.css
mkdir assets
put -r assets/*
bye
```

Repeat with `VN/index.html` and `SG/index.html` for the other two domains.

