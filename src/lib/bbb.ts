import crypto from 'crypto';

/**
 * BigBlueButton API Integration
 * Handles meeting creation and join URL generation
 */

interface BBBConfig {
  url: string;
  secret: string;
}

interface CreateMeetingParams {
  meetingID: string;
  meetingName: string;
  attendeePW?: string;
  moderatorPW?: string;
  welcome?: string;
  maxParticipants?: number;
  record?: boolean;
  autoStartRecording?: boolean;
  allowStartStopRecording?: boolean;
}

interface JoinMeetingParams {
  meetingID: string;
  fullName: string;
  password: string;
  userID?: string;
  role?: 'moderator' | 'viewer';
}

export class BigBlueButtonAPI {
  private url: string;
  private secret: string;

  constructor(config?: BBBConfig) {
    // Use environment variables or provided config
    this.url = config?.url || process.env.BBB_URL || '';
    this.secret = config?.secret || process.env.BBB_SECRET || 'bVLnYjQPwaHEXr5TCnpS67Cg6Ygy4N8dBzihXuuj5DE';
    
    if (!this.url) {
      throw new Error('BBB_URL is not configured. Please set it in environment variables or pass it in config.');
    }
  }

  /**
   * Generate checksum for BBB API calls
   */
  private generateChecksum(callName: string, queryString: string): string {
    const data = callName + queryString + this.secret;
    return crypto.createHash('sha1').update(data).digest('hex');
  }

  /**
   * Build API URL with checksum
   */
  private buildUrl(callName: string, params: Record<string, string>): string {
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const checksum = this.generateChecksum(callName, queryString);
    return `${this.url}/bigbluebutton/api/${callName}?${queryString}&checksum=${checksum}`;
  }

  /**
   * Create a new meeting or return existing one
   */
  async createMeeting(params: CreateMeetingParams): Promise<{ success: boolean; message?: string; meetingID?: string; response?: string }> {
    const {
      meetingID,
      meetingName,
      attendeePW = 'ap',
      moderatorPW = 'mp',
      welcome = 'به کلاس آنلاین خوش آمدید',
      maxParticipants = 100,
      record = false,
      autoStartRecording = false,
      allowStartStopRecording = true,
    } = params;

    // Generate a random voice bridge number (70000-79999)
    const voiceBridge = Math.floor(70000 + Math.random() * 10000).toString();

    const createParams: Record<string, string> = {
      meetingID,
      name: meetingName,
      attendeePW,
      moderatorPW,
      welcome,
      voiceBridge,
      maxParticipants: maxParticipants.toString(),
      record: record.toString(),
      autoStartRecording: autoStartRecording.toString(),
      allowStartStopRecording: allowStartStopRecording.toString(),
      logoutURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/myclass`,
    };

    const url = this.buildUrl('create', createParams);

    try {
      // console.log('Creating BBB meeting with URL:', url);
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      // console.log('BBB create response:', text);
      
      // Parse XML response
      const successMatch = text.match(/<returncode>(.*?)<\/returncode>/);
      const messageMatch = text.match(/<message>(.*?)<\/message>/);
      const messageKeyMatch = text.match(/<messageKey>(.*?)<\/messageKey>/);
      
      if (successMatch && successMatch[1] === 'SUCCESS') {
        return {
          success: true,
          meetingID,
        };
      } else {
        const errorMsg = messageMatch ? messageMatch[1] : 'Failed to create meeting';
        const errorKey = messageKeyMatch ? ` (${messageKeyMatch[1]})` : '';
        return {
          success: false,
          message: errorMsg + errorKey,
          response: text,
        };
      }
    } catch (error) {
      console.error('Error creating BBB meeting:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if a meeting is running
   */
  async isMeetingRunning(meetingID: string): Promise<boolean> {
    const params = { meetingID };
    const url = this.buildUrl('isMeetingRunning', params);

    try {
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      
      const runningMatch = text.match(/<running>(.*?)<\/running>/);
      return runningMatch ? runningMatch[1] === 'true' : false;
    } catch (error) {
      console.error('Error checking meeting status:', error);
      return false;
    }
  }

  /**
   * Generate join URL for a participant
   */
  generateJoinUrl(params: JoinMeetingParams): string {
    const { meetingID, fullName, password, userID } = params;
    
    const joinParams: Record<string, string> = {
      meetingID,
      fullName,
      password,
      redirect: 'true', // Enable redirect to meeting
    };

    if (userID) {
      joinParams.userID = userID;
    }

    return this.buildUrl('join', joinParams);
  }

  /**
   * End a meeting
   */
  async endMeeting(meetingID: string, moderatorPW: string): Promise<{ success: boolean; message?: string }> {
    const params = {
      meetingID,
      password: moderatorPW,
    };

    const url = this.buildUrl('end', params);

    try {
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      
      const successMatch = text.match(/<returncode>(.*?)<\/returncode>/);
      const messageMatch = text.match(/<message>(.*?)<\/message>/);
      
      if (successMatch && successMatch[1] === 'SUCCESS') {
        return { success: true };
      } else {
        return {
          success: false,
          message: messageMatch ? messageMatch[1] : 'Failed to end meeting',
        };
      }
    } catch (error) {
      console.error('Error ending BBB meeting:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get meeting info
   */
  async getMeetingInfo(meetingID: string, moderatorPW: string): Promise<any> {
    const params = {
      meetingID,
      password: moderatorPW,
    };

    const url = this.buildUrl('getMeetingInfo', params);

    try {
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      return text; // Return raw XML for now
    } catch (error) {
      console.error('Error getting meeting info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const bbbAPI = new BigBlueButtonAPI();

