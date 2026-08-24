# Azure Production Deployment

This application is deployed as a Vite static frontend on Azure Static Web Apps.
Supabase Cloud provides authentication, PostgreSQL, storage, and realtime data.

## 1. Prepare Supabase Cloud

1. Create a production project at <https://supabase.com/dashboard>.
2. Apply the SQL migrations in `supabase/migrations` in timestamp order.
3. Configure and verify row-level security for every public table and storage bucket.
4. In **Authentication > URL Configuration**, set the site URL to the Azure URL.
5. Add the Azure production and pull-request preview URLs as redirect URLs.
6. Copy the project URL and anon key from **Project Settings > API**.

Never expose the Supabase service-role key to Vite or GitHub Actions. Values whose
names begin with `VITE_` are compiled into the browser bundle and are public.

## 2. Create Azure Static Web Apps

In the Azure portal, select **Create a resource > Static Web App** and use:

| Setting | Value |
| --- | --- |
| Deployment source | GitHub |
| Repository | `Aravindthangarasu-bot/LEO-PERMIT-APP` |
| Branch | `main` |
| Build preset | Custom |
| App location | `/` |
| API location | Leave empty |
| Output location | `dist` |

Azure may create its own workflow. Keep `.github/workflows/azure-static-web-apps.yml`
and remove the generated duplicate workflow after copying its deployment token.

## 3. Configure GitHub

In **Repository Settings > Environments**, create an environment named
`production`. Add these environment secrets:

| Secret | Source |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Azure Static Web App > Manage deployment token |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

The workflow deploys `main`, creates preview environments for pull requests, and
removes each preview when its pull request closes.

## 4. Deploy

Commit and push the prepared files to `main`, or run **Deploy to Azure Static Web
Apps** from the GitHub Actions page. The workflow executes `npm run build:azure`.

After the first deployment, update the Supabase site URL and redirect allow-list
with the final Azure hostname, then redeploy if those values affect authentication.

## 5. Production Checks

- Open `/`, `/login`, and a protected deep link directly in a new browser tab.
- Sign in as customer, provider, staff, and admin test users.
- Submit an application and confirm database persistence.
- Upload and download a document using private storage policies.
- Confirm notifications arrive without refreshing the browser.
- Verify users cannot read or modify another account's records.
- Run the Playwright smoke tests against the Azure URL.
- Add a custom domain and verify Azure-managed HTTPS before public launch.

## Local Azure Build

Use production-like values without committing them:

```powershell
$env:VITE_SUPABASE_URL = "https://your-project.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "your-anon-key"
npm ci
npm run build:azure
```

The generated deployment artifact is the `dist` directory.