const axios = require('axios');
const moment = require('moment');

class ZoomService {
  constructor() {
    this.apiKey = process.env.ZOOM_API_KEY;
    this.apiSecret = process.env.ZOOM_API_SECRET;
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.baseUrl = 'https://api.zoom.us/v2';
    this.token = null;
    this.tokenExpiration = null;
  }

  async getAccessToken() {
    if (this.token && this.tokenExpiration && moment().isBefore(this.tokenExpiration)) {
      return this.token;
    }

    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'account_credentials',
        account_id: this.accountId
      },
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`
      }
    });

    this.token = response.data.access_token;
    this.tokenExpiration = moment().add(response.data.expires_in, 'seconds');
    return this.token;
  }

  async createMeeting(topic, startTime, duration, password) {
    const token = await this.getAccessToken();
    
    const response = await axios.post(`${this.baseUrl}/users/me/meetings`, {
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration,
      password,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'cloud'
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  async getMeeting(meetingId) {
    const token = await this.getAccessToken();
    
    const response = await axios.get(`${this.baseUrl}/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  }

  async updateMeeting(meetingId, updates) {
    const token = await this.getAccessToken();
    
    const response = await axios.patch(`${this.baseUrl}/meetings/${meetingId}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  async deleteMeeting(meetingId) {
    const token = await this.getAccessToken();
    
    await axios.delete(`${this.baseUrl}/meetings/${meetingId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  async getMeetingParticipants(meetingId) {
    const token = await this.getAccessToken();
    
    const response = await axios.get(`${this.baseUrl}/metrics/meetings/${meetingId}/participants`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  }
}

module.exports = new ZoomService(); 