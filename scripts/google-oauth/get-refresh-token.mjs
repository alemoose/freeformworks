import http from 'http';
import { google } from 'googleapis';
import open from 'open';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT = 'http://localhost:3333/oauth/callback';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\nMissing env vars. Run:\n');
  console.error('  export GOOGLE_CLIENT_ID="....apps.googleusercontent.com"');
  console.error('  export GOOGLE_CLIENT_SECRET="...."\n');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT);

const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth/callback')) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const code = new URL(req.url, 'http://localhost:3333').searchParams.get('code');
    if (!code) throw new Error('No code in callback URL');
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('No refresh_token — revoke app access at myaccount.google.com/permissions and run again');
    }
    console.log('\n--- Save these somewhere safe (1Password, not git) ---\n');
    console.log('GOOGLE_CLIENT_ID=' + CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET=' + CLIENT_SECRET);
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n-----------------------------------------------------\n');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<p>Success. Check your terminal for GOOGLE_REFRESH_TOKEN, then close this tab.</p>');
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Error — see terminal');
  } finally {
    server.close();
  }
});

server.listen(3333, () => {
  console.log('Opening browser for Google sign-in…');
  console.log('Use the same account as your booking calendar.\n');
  open(url);
});
