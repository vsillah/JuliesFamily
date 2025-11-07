import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export interface CreateEventResponse {
  id: string;
  htmlLink: string;
  summary: string;
  start: string;
  end: string;
}

export class CalendarService {
  private static CALENDAR_ID = 'primary';
  private static DEFAULT_TIMEZONE = 'America/New_York';

  static async createEvent(event: CalendarEvent): Promise<CreateEventResponse> {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      
      const response = await calendar.events.insert({
        calendarId: this.CALENDAR_ID,
        requestBody: {
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          sendUpdates: 'all',
        },
      });

      return {
        id: response.data.id!,
        htmlLink: response.data.htmlLink!,
        summary: response.data.summary!,
        start: response.data.start?.dateTime || response.data.start?.date || '',
        end: response.data.end?.dateTime || response.data.end?.date || '',
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  static async getEvent(eventId: string) {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      
      const response = await calendar.events.get({
        calendarId: this.CALENDAR_ID,
        eventId: eventId,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching calendar event:', error);
      throw new Error('Failed to fetch calendar event');
    }
  }

  static async updateEvent(eventId: string, updates: Partial<CalendarEvent>) {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      
      const response = await calendar.events.patch({
        calendarId: this.CALENDAR_ID,
        eventId: eventId,
        requestBody: updates as any,
      });

      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  static async deleteEvent(eventId: string) {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      
      await calendar.events.delete({
        calendarId: this.CALENDAR_ID,
        eventId: eventId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  static async listEvents(timeMin?: string, timeMax?: string, maxResults = 50) {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      
      const response = await calendar.events.list({
        calendarId: this.CALENDAR_ID,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw new Error('Failed to list calendar events');
    }
  }

  static async checkAvailability(startDateTime: string, endDateTime: string) {
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startDateTime,
          timeMax: endDateTime,
          items: [{ id: this.CALENDAR_ID }],
        },
      });

      const busySlots = response.data.calendars?.[this.CALENDAR_ID]?.busy || [];
      return {
        available: busySlots.length === 0,
        busySlots: busySlots,
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  static formatDateTime(date: string, time: string, timezone = this.DEFAULT_TIMEZONE): string {
    const dateTimeString = `${date}T${time}:00`;
    return new Date(dateTimeString).toISOString();
  }
}
