const axios = require('axios');
const moment = require('moment-timezone');

class ZoomAPIService {
  constructor() {
    this.baseURL = 'https://api.zoom.us/v2';
    this.accessToken = null;
  }

  async initialize() {
    try {
      // Check if Zoom credentials are configured
      if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
        return false;
      }

      // Get access token using Server-to-Server OAuth
      await this.getAccessToken();
      
      return !!this.accessToken;
    } catch (error) {
      console.error('Zoom API initialization error:', error.message);
      return false;
    }
  }

  async getAccessToken() {
    try {
      const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
      
      const response = await axios.post('https://zoom.us/oauth/token', 
        `grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      return true;
    } catch (error) {
      console.error('Error getting Zoom access token:', error.response?.data || error.message);
      return false;
    }
  }

  async createMeeting(eventDetails) {
    try {
      const { fullName, email, selectedDate, selectedTime, message } = eventDetails;
      
      // Parse the date and time in IST
      const eventDateTime = this.parseDateTime(selectedDate, selectedTime);
      const startTime = eventDateTime.format('YYYY-MM-DDTHH:mm:ss');
      
      const meetingData = {
        topic: `Demo Meeting with ${fullName}`,
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration: 30, // 30 minutes
        timezone: 'Asia/Kolkata',
        agenda: `Demo meeting with ${fullName} (${email})\n\nRequirements: ${message || 'No specific requirements mentioned'}`,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0, // Automatically approve
          audio: 'both',
          auto_recording: 'none',
          waiting_room: false
        }
      };

      const response = await axios.post(`${this.baseURL}/users/me/meetings`, meetingData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const meeting = response.data;

      return {
        success: true,
        meetingId: meeting.id,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        password: meeting.password,
        meetingData: meeting
      };

    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  parseDateTime(dateString, timeString) {
    const datePart = moment.tz(dateString, 'MMMM DD, YYYY', 'Asia/Kolkata');
    const timePart = moment.tz(timeString, 'h:mm A', 'Asia/Kolkata');
    
    const combined = datePart.clone()
      .hour(timePart.hour())
      .minute(timePart.minute())
      .second(0)
      .millisecond(0);

    return combined;
  }
}

module.exports = ZoomAPIService;