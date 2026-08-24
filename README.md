# React + TypeScript + Vite

## Azure Hosting

The repository includes an Azure Static Web Apps workflow, SPA routing rules, and
production security headers. Follow the [Azure deployment guide](docs/AZURE_DEPLOYMENT.md)
to configure Supabase Cloud, Azure, and the required GitHub environment secrets.

## Share with Docker

The frontend is compiled with its Supabase connection values. Use a Supabase URL
that is reachable from every device that will open the shared application.

```powershell
docker build -t leo-permit-app `
  --build-arg VITE_SUPABASE_URL="https://your-project.supabase.co" `
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" `
  .

docker run --rm -p 8080:8080 --name leo-permit-app leo-permit-app
```

Open `http://localhost:8080`. To share it on the same network, allow inbound TCP
port `8080` in Windows Firewall and send `http://YOUR-PC-IP:8080` to the other
user. For internet sharing, publish this image through a container host and build
it with the public Supabase project URL.

The Supabase anon key is designed for browser use. Keep the service-role key out
of Docker build arguments and frontend environment variables.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
