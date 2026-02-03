# Deployment Setup Guide

This guide explains how to set up automatic deployments for the Share-Crop Frontend application.

## Overview

The application uses GitHub Actions to automatically build and deploy to Netlify whenever code is pushed to the `main` branch.

## Prerequisites

1. A GitHub account with access to this repository
2. A Netlify account (free tier works)
3. Repository admin access to add secrets

## Setup Instructions

### 1. Create Netlify Site

1. Sign up or log in to [Netlify](https://www.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select this repository
4. **Important**: Don't configure build settings - we'll use GitHub Actions instead
5. Click "Deploy site" (it will create the site even without settings)
6. Note down your site name (e.g., `your-site-name.netlify.app`)

### 2. Get Netlify Credentials

1. Go to your Netlify dashboard
2. Navigate to **User Settings** → **Applications** → **Personal access tokens**
3. Click "New access token" and create a token with a descriptive name (e.g., "GitHub Actions")
4. **Copy the token** - you won't see it again!
5. Go to your site settings and copy the **Site ID** from **Site settings** → **General** → **Site information**

### 3. Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret" and add:
   - **Name**: `NETLIFY_AUTH_TOKEN`
   - **Value**: Your Netlify personal access token from step 2
4. Click "New repository secret" again and add:
   - **Name**: `NETLIFY_SITE_ID`
   - **Value**: Your Netlify site ID from step 2

### 4. Add Environment Variables (Optional)

If your app requires environment variables (like `REACT_APP_MAPBOX_ACCESS_TOKEN`):

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add them as repository secrets
3. Update `.github/workflows/deploy.yml` to include them in the build step:

```yaml
- name: Build project
  run: npm run build
  env:
    CI: false
    REACT_APP_MAPBOX_ACCESS_TOKEN: ${{ secrets.REACT_APP_MAPBOX_ACCESS_TOKEN }}
```

## How It Works

### Automatic Deployment

When you push to the `main` branch:

1. GitHub Actions automatically runs the workflow
2. The workflow installs dependencies
3. Builds the React application
4. Deploys the build to Netlify
5. Your site updates within 1-2 minutes

### Pull Request Previews

When you create a pull request:

1. GitHub Actions builds the code
2. Creates a preview deployment on Netlify
3. Adds a comment to the PR with the preview URL
4. Allows you to test changes before merging

## Troubleshooting

### Build Fails

If the GitHub Actions build fails:

1. Check the Actions tab in GitHub for error details
2. Common issues:
   - **ESLint errors**: Fix code style issues in the indicated files
   - **Missing dependencies**: Ensure `package.json` is up to date
   - **Environment variables**: Make sure required secrets are configured

### Deployment Doesn't Update

If the deployment isn't updating after a successful build:

1. Verify GitHub secrets are correctly configured
2. Check the Actions tab to ensure the workflow completed successfully
3. Look for the "Deploy to Netlify" step in the workflow logs
4. Verify your Netlify auth token hasn't expired

### Local Build Test

To test if your code builds successfully locally:

```bash
npm install
npm run build
```

If this fails, fix the errors before pushing.

## Manual Deployment

If you need to deploy manually without GitHub Actions:

### Via Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=build
```

### Via Netlify Dashboard

1. Run `npm run build` locally
2. Go to Netlify dashboard → Your site → Deploys
3. Drag and drop the `build` folder

## Monitoring Deployments

- **GitHub Actions**: Check the "Actions" tab in your repository
- **Netlify Dashboard**: View deployment history and logs at app.netlify.com
- **Deployment Status**: GitHub automatically updates commit status indicators

## Best Practices

1. **Test Locally**: Always run `npm run build` locally before pushing
2. **Use Pull Requests**: Create PRs to test preview deployments before merging
3. **Environment Variables**: Never commit sensitive tokens to the repository
4. **Monitor Logs**: Check GitHub Actions logs if deployments fail
5. **Keep Dependencies Updated**: Run `npm update` regularly

## Additional Configuration

### Custom Domain

To use a custom domain:

1. Go to Netlify dashboard → Your site → Domain settings
2. Add your custom domain
3. Follow Netlify's DNS configuration instructions

### Build Settings

The build is configured in `.github/workflows/deploy.yml`:

- **Build command**: `npm run build`
- **Publish directory**: `build/`
- **Node version**: 18

## Support

If you encounter issues:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review [Netlify deployment documentation](https://docs.netlify.com/)
3. Check the repository's Issues page for similar problems
4. Contact the development team

## Summary

✅ Automatic deployments on push to main
✅ Preview deployments for pull requests  
✅ Build status indicators in GitHub
✅ Fast deployment (1-2 minutes)
✅ Free hosting with Netlify

Your deployment pipeline is now set up! Every commit to `main` will automatically deploy to production.
