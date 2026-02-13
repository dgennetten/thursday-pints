# Automated Deployment via GitHub Issues

This guide explains how to use GitHub Issues to automatically add new visits and deploy updates to the Thursday Pints website.

## Overview

When authorized users create a GitHub Issue using the "Add New Visit" template, a GitHub Action workflow will:
1. Parse the issue data
2. Update `data.json` with the new visit
3. Build the application
4. Deploy to Dreamhost via FTP
5. Close the issue with a confirmation comment

## Setup Instructions

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** and add the following secrets:

- **`FTP_SERVER`**: Your Dreamhost FTP server (e.g., `ftp.yourdomain.com` or `yourdomain.com`)
- **`FTP_USERNAME`**: Your Dreamhost FTP username
- **`FTP_PASSWORD`**: Your Dreamhost FTP password

### Step 2: Set Up Access Control

**Option A: Private Repository (Recommended)**
- Keep the repository private
- Go to **Settings** → **Collaborators**
- Add authorized users who should be able to submit visits

**Option B: Public Repository**
- Use GitHub's issue templates (already configured)
- Only users with write access can create issues that trigger deployment
- Consider using branch protection rules

### Step 3: Test the Workflow

1. Go to your repository on GitHub
2. Click **Issues** → **New Issue**
3. Select **"Add New Visit"** template
4. Fill out the form:
   - **Visit Date**: Leave blank to default to next Thursday, or enter date in YYYY-MM-DD format
   - **Brewery Name**: Required - name of the brewery visited
   - **Next Brewery**: Required - either a limerick or brewery name for next week
   - **Notes**: Optional - any additional notes
5. Check the confirmation checkbox
6. Click **Submit new issue**

The workflow will automatically:
- Process the issue
- Add the visit to `data.json`
- Build and deploy the site
- Comment on the issue with confirmation
- Close the issue

## How It Works

### Issue Template
The template (`.github/ISSUE_TEMPLATE/new-visit.yml`) provides a structured form for submitting visits.

### Workflow
The workflow (`.github/workflows/process-visit.yml`) triggers when:
- An issue with the "visit" label is opened or edited
- It extracts data from the issue body
- Calculates next Thursday if date is not provided
- Updates `data.json` in both `public/` and `dist/` folders
- Builds the application
- Commits changes back to the repository
- Deploys to Dreamhost via FTP
- Comments on the issue and closes it

### Script
The script (`scripts/add-visit.js`) handles:
- Parsing command-line arguments
- Reading existing `data.json`
- Adding or updating visit entries
- Writing updated data to both `public/data.json` and `dist/data.json`

## Date Handling

- If **Visit Date** is left blank, the workflow automatically calculates the next Thursday
- Dates should be in `YYYY-MM-DD` format (e.g., `2026-02-12`)
- If a visit already exists for a given date, it will be updated instead of creating a duplicate

## Troubleshooting

### Workflow Not Triggering
- Ensure the issue has the "visit" label (automatically added by the template)
- Check that the issue body contains all required fields
- Review workflow logs in **Actions** tab

### FTP Deployment Failing
- Verify FTP credentials in GitHub Secrets
- Check that `FTP_SERVER` includes the correct port if needed (default is 21)
- Ensure Dreamhost allows FTP connections from GitHub Actions IPs
- Review FTP deployment logs in the workflow

### Data Not Updating
- Check that `data.json` format is valid JSON
- Verify the script has write permissions
- Review workflow logs for parsing errors

### Date Calculation Issues
- The next Thursday calculation uses JavaScript Date logic
- If today is Thursday, it will use next week's Thursday
- Dates are in UTC timezone

## Manual Deployment

If you need to manually deploy (outside of the issue workflow):

```bash
npm run build
# Then upload dist/ folder to Dreamhost via FTP
```

Or push to main/master branch - the `deploy.yml` workflow will automatically deploy.

## Security Notes

- FTP passwords are stored as GitHub Secrets (encrypted)
- Only users with repository access can create issues
- Consider using SFTP if Dreamhost supports it (would require workflow modification)
- Review workflow logs regularly for any suspicious activity

## Future Enhancements

Possible improvements:
- Add validation for brewery names against `breweries.json`
- Support for bulk visit additions
- Email notifications on successful deployment
- Preview of changes before deployment
- Rollback capability
