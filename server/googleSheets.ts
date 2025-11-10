import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export function parseGoogleSheetUrl(url: string): { spreadsheetId: string; gid?: string; range?: string } | null {
  try {
    // Support various Google Sheets URL formats:
    // https://docs.google.com/spreadsheets/d/{id}/edit#gid={gid}
    // https://docs.google.com/spreadsheets/d/{id}/edit
    
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;

    const spreadsheetId = match[1];
    
    // Extract gid (sheet ID) from URL fragment or query params
    const gidMatch = url.match(/[#&]gid=(\d+)/);
    
    return {
      spreadsheetId,
      gid: gidMatch ? gidMatch[1] : undefined,
      range: undefined // Will read all data by default
    };
  } catch (error) {
    console.error('Error parsing Google Sheets URL:', error);
    return null;
  }
}

export async function fetchSheetData(spreadsheetId: string, gid?: string, range?: string): Promise<any[]> {
  const sheets = await getUncachableGoogleSheetClient();
  
  // Get spreadsheet metadata to find the correct sheet
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  let sheetName: string;
  
  if (gid) {
    // Find the sheet with the matching gid
    const targetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === gid
    );
    sheetName = targetSheet?.properties?.title || metadata.data.sheets?.[0]?.properties?.title || 'Sheet1';
  } else {
    // Use the first sheet if no gid specified
    sheetName = metadata.data.sheets?.[0]?.properties?.title || 'Sheet1';
  }

  const fullRange = range || sheetName;
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }

  // Convert to JSON format (first row as headers)
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });

  return data;
}
