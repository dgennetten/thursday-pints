# Build and Deploy Script

This script builds the application and deploys it to Dreamhost via FTP.

## Setup

1. Create a `.env.local` file in the project root with the following variables:

```env
# FTP Deployment Configuration
FTP_SERVER=your-ftp-server.dreamhost.com
FTP_USERNAME=your-username
FTP_PASSWORD=your-password
FTP_SERVER_DIR=/thursdaypints.com/
```

2. Install dependencies (if not already installed):
```bash
npm install
```

## Usage

Run the deploy script:
```bash
npm run deploy
```

This will:
1. Build the application (`npm run build`)
2. Verify the `dist/` directory exists
3. Connect to your FTP server
4. Upload all files from `dist/` to the server directory
5. Verify the upload was successful

## Notes

- The `.env.local` file is already in `.gitignore` and will not be committed
- The script uses `basic-ftp` for FTP operations
- The default server directory is `/thursdaypints.com/` if `FTP_SERVER_DIR` is not specified
- The script will verify that `data.json` was uploaded correctly by comparing file sizes
