# BLACK BOX full-stack deployment

GitHub stores the source. Run this Node.js 24 application on a Docker-capable host with a persistent volume; GitHub Pages cannot run the API and SQLite database.

## Render

Connect the GitHub repository and import `render.yaml` as a Blueprint. This config requests a **free demo web service without a persistent disk**. SQLite data is ephemeral and can disappear on restart/redeploy. Free services may sleep when idle. The owner explicitly selected this tradeoff. No paid resources are requested.

The server exposes `/healthz`. `/data` holds synthetic visitor cases and the demo signer on the temporary instance filesystem. `HOST=0.0.0.0` enables platform routing. `PORT` follows the platform environment. HTTPS origins are supported; optionally configure `PUBLIC_ORIGIN` with the exact live origin.

Each visitor has a separate demo case via an HttpOnly SameSite cookie. Production cookies require HTTPS. This is anonymous demo isolation, not production account authentication. Assets, attacks, clauses and investigation outputs remain synthetic/local ledger simulations.

Do not publish `data/`, signer keys, `.tools/`, personal references, or test output.

## Local Docker

```sh
docker build -t black-box .
docker run --rm -p 3000:3000 -e NODE_ENV=development -v blackbox-data:/data black-box
```

For internet hosting, keep production mode and terminate HTTPS at the hosting proxy. A paid persistent volume would be necessary for data to survive restarts/redeployments; it is not configured here.
