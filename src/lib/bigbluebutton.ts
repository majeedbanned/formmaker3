/**
 * BigBlueButton API Client
 * Handles meeting creation, joining, and management
 * Documentation: https://docs.bigbluebutton.org/development/api/
 */

import crypto from "crypto";

interface BBBMeeting {
  meetingID: string;
  meetingName: string;
  attendeePW: string;
  moderatorPW: string;
  createTime: number;
}

interface BBBJoinUrl {
  url: string;
  meetingID: string;
  fullName: string;
}

export class BigBlueButtonApiClient {
  private serverUrl: string;
  private secret: string;

  constructor(serverUrl: string, secret: string) {
    // Ensure server URL ends with /bigbluebutton/api
    this.serverUrl = serverUrl.replace(/\/+$/, "");
    if (!this.serverUrl.includes("/bigbluebutton/api")) {
      this.serverUrl = `${this.serverUrl}/bigbluebutton/api`;
    }
    this.secret = secret;
  }

  /**
   * Calculate checksum for API call
   * SHA-1(apiCallName + queryString + secret)
   */
  private calculateChecksum(apiCall: string, queryString: string): string {
    const data = `${apiCall}${queryString}${this.secret}`;
    return crypto.createHash("sha1").update(data).digest("hex");
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, string | number | boolean>): string {
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
    return filteredParams;
  }

  /**
   * Make an API request to BigBlueButton
   */
  private async request(
    apiCall: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<string> {
    const queryString = this.buildQueryString(params);
    const checksum = this.calculateChecksum(apiCall, queryString);
    
    const url = queryString
      ? `${this.serverUrl}/${apiCall}?${queryString}&checksum=${checksum}`
      : `${this.serverUrl}/${apiCall}?checksum=${checksum}`;

    console.log(`[BBB] Request: ${apiCall}`, { url: url.substring(0, 200) + "..." });

    try {
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`[BBB] Response for ${apiCall}:`, text.substring(0, 500));
      return text;
    } catch (error) {
      console.error(`[BBB] API request error (${apiCall}):`, error);
      throw error;
    }
  }

  /**
   * Parse XML response and check for success
   */
  private parseResponse(xml: string): {
    success: boolean;
    returncode?: string;
    messageKey?: string;
    message?: string;
    meetingID?: string;
    attendeePW?: string;
    moderatorPW?: string;
    createTime?: string;
  } {
    const returncodeMatch = xml.match(/<returncode>([^<]+)<\/returncode>/);
    const returncode = returncodeMatch?.[1];
    const success = returncode === "SUCCESS";

    const messageKeyMatch = xml.match(/<messageKey>([^<]+)<\/messageKey>/);
    const messageMatch = xml.match(/<message>([^<]+)<\/message>/);
    const meetingIDMatch = xml.match(/<meetingID>([^<]+)<\/meetingID>/);
    const attendeePWMatch = xml.match(/<attendeePW>([^<]+)<\/attendeePW>/);
    const moderatorPWMatch = xml.match(/<moderatorPW>([^<]+)<\/moderatorPW>/);
    const createTimeMatch = xml.match(/<createTime>([^<]+)<\/createTime>/);

    return {
      success,
      returncode,
      messageKey: messageKeyMatch?.[1],
      message: messageMatch?.[1],
      meetingID: meetingIDMatch?.[1],
      attendeePW: attendeePWMatch?.[1],
      moderatorPW: moderatorPWMatch?.[1],
      createTime: createTimeMatch?.[1],
    };
  }

  /**
   * Generate random password
   */
  private generatePassword(length: number = 8): string {
    return crypto.randomBytes(length).toString("hex").substring(0, length);
  }

  /**
   * Create a new meeting
   */
  async createMeeting(params: {
    meetingID?: string;
    name: string;
    attendeePW?: string;
    moderatorPW?: string;
    welcome?: string;
    maxParticipants?: number;
    duration?: number;
    record?: boolean;
  }): Promise<BBBMeeting> {
    // Generate unique meeting ID if not provided
    const meetingID = params.meetingID || `meeting-${Date.now()}-${this.generatePassword(6)}`;
    const attendeePW = params.attendeePW || this.generatePassword(8);
    const moderatorPW = params.moderatorPW || this.generatePassword(8);

    const apiParams: Record<string, string | number | boolean> = {
      meetingID,
      name: params.name,
      attendeePW,
      moderatorPW,
    };

    if (params.welcome) {
      apiParams.welcome = params.welcome;
    }
    if (params.maxParticipants) {
      apiParams.maxParticipants = params.maxParticipants;
    }
    if (params.duration) {
      apiParams.duration = params.duration;
    }
    if (params.record !== undefined) {
      apiParams.record = params.record;
    }

    const xml = await this.request("create", apiParams);
    const result = this.parseResponse(xml);

    if (!result.success) {
      // Check if meeting already exists (idNotUnique)
      if (result.messageKey === "idNotUnique") {
        console.log(`[BBB] Meeting ${meetingID} already exists, returning existing info`);
        return {
          meetingID,
          meetingName: params.name,
          attendeePW,
          moderatorPW,
          createTime: Date.now(),
        };
      }
      throw new Error(result.message || `Failed to create meeting: ${result.messageKey}`);
    }

    return {
      meetingID: result.meetingID || meetingID,
      meetingName: params.name,
      attendeePW: result.attendeePW || attendeePW,
      moderatorPW: result.moderatorPW || moderatorPW,
      createTime: result.createTime ? parseInt(result.createTime) : Date.now(),
    };
  }

  /**
   * Generate join URL for a user
   * @param meetingID - The meeting ID
   * @param fullName - The user's display name
   * @param password - Either attendee password (participant) or moderator password (host)
   * @param userID - Optional user ID for tracking
   * @param listenOnly - If true, user joins in listen-only mode (no microphone)
   */
  getJoinUrl(params: {
    meetingID: string;
    fullName: string;
    password: string;
    userID?: string;
    redirect?: boolean;
    listenOnly?: boolean;
  }): string {
    const apiParams: Record<string, string | number | boolean> = {
      meetingID: params.meetingID,
      fullName: params.fullName,
      password: params.password,
      redirect: params.redirect !== false ? "true" : "false",
    };

    if (params.userID) {
      apiParams.userID = params.userID;
    }

    // Add listen-only mode for students (no microphone access)
    // This forces the user to join in listen-only mode without microphone
    if (params.listenOnly === true) {
      apiParams["userdata-bbb_force_listen_only"] = "true";
    }

    const queryString = this.buildQueryString(apiParams);
    const checksum = this.calculateChecksum("join", queryString);

    return `${this.serverUrl}/join?${queryString}&checksum=${checksum}`;
  }

  /**
   * Check if a meeting is running
   */
  async isMeetingRunning(meetingID: string): Promise<boolean> {
    const xml = await this.request("isMeetingRunning", { meetingID });
    const runningMatch = xml.match(/<running>([^<]+)<\/running>/);
    return runningMatch?.[1] === "true";
  }

  /**
   * Get meeting info
   */
  async getMeetingInfo(meetingID: string): Promise<{
    meetingID: string;
    meetingName: string;
    running: boolean;
    participantCount: number;
    moderatorCount: number;
  } | null> {
    try {
      const xml = await this.request("getMeetingInfo", { meetingID });
      const result = this.parseResponse(xml);

      if (!result.success) {
        return null;
      }

      const meetingNameMatch = xml.match(/<meetingName>([^<]+)<\/meetingName>/);
      const runningMatch = xml.match(/<running>([^<]+)<\/running>/);
      const participantCountMatch = xml.match(/<participantCount>([^<]+)<\/participantCount>/);
      const moderatorCountMatch = xml.match(/<moderatorCount>([^<]+)<\/moderatorCount>/);

      return {
        meetingID: result.meetingID || meetingID,
        meetingName: meetingNameMatch?.[1] || "",
        running: runningMatch?.[1] === "true",
        participantCount: parseInt(participantCountMatch?.[1] || "0"),
        moderatorCount: parseInt(moderatorCountMatch?.[1] || "0"),
      };
    } catch {
      return null;
    }
  }

  /**
   * End a meeting
   */
  async endMeeting(meetingID: string, moderatorPW: string): Promise<boolean> {
    try {
      const xml = await this.request("end", { meetingID, password: moderatorPW });
      const result = this.parseResponse(xml);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get recordings for a meeting
   */
  async getRecordings(meetingID?: string): Promise<Array<{
    recordID: string;
    meetingID: string;
    name: string;
    published: boolean;
    startTime: number;
    endTime: number;
    playbackUrl: string;
    thumbnailUrl?: string;
    duration: number;
  }>> {
    try {
      const params: Record<string, string> = {};
      if (meetingID) {
        params.meetingID = meetingID;
      }

      const xml = await this.request("getRecordings", params);
      const result = this.parseResponse(xml);

      if (!result.success) {
        return [];
      }

      const recordings: Array<{
        recordID: string;
        meetingID: string;
        name: string;
        published: boolean;
        startTime: number;
        endTime: number;
        playbackUrl: string;
        thumbnailUrl?: string;
        duration: number;
      }> = [];

      // Parse recordings from XML
      const recordingRegex = /<recording>([\s\S]*?)<\/recording>/g;
      let match;
      while ((match = recordingRegex.exec(xml)) !== null) {
        const recordingXml = match[1];
        
        const recordIDMatch = recordingXml.match(/<recordID>([^<]+)<\/recordID>/);
        const meetingIDMatch = recordingXml.match(/<meetingID>([^<]+)<\/meetingID>/);
        const nameMatch = recordingXml.match(/<name>([^<]+)<\/name>/);
        const publishedMatch = recordingXml.match(/<published>([^<]+)<\/published>/);
        const startTimeMatch = recordingXml.match(/<startTime>([^<]+)<\/startTime>/);
        const endTimeMatch = recordingXml.match(/<endTime>([^<]+)<\/endTime>/);
        
        // Get playback URL - usually in format section
        const playbackUrlMatch = recordingXml.match(/<playback>[\s\S]*?<url>([^<]+)<\/url>[\s\S]*?<\/playback>/);
        const thumbnailMatch = recordingXml.match(/<preview>[\s\S]*?<image[^>]*>([^<]+)<\/image>[\s\S]*?<\/preview>/);

        if (recordIDMatch && meetingIDMatch) {
          const startTime = parseInt(startTimeMatch?.[1] || "0");
          const endTime = parseInt(endTimeMatch?.[1] || "0");
          const duration = endTime > startTime ? Math.round((endTime - startTime) / 60000) : 0;

          recordings.push({
            recordID: recordIDMatch[1],
            meetingID: meetingIDMatch[1],
            name: nameMatch?.[1] || "Recording",
            published: publishedMatch?.[1] === "true",
            startTime,
            endTime,
            playbackUrl: playbackUrlMatch?.[1] || "",
            thumbnailUrl: thumbnailMatch?.[1],
            duration,
          });
        }
      }

      return recordings;
    } catch (err) {
      console.error("[BBB] Error fetching recordings:", err);
      return [];
    }
  }

  /**
   * Get attendees currently in a meeting
   */
  async getAttendees(meetingID: string): Promise<Array<{
    userID: string;
    fullName: string;
    role: "MODERATOR" | "VIEWER";
    isPresenter: boolean;
    isListeningOnly: boolean;
  }>> {
    try {
      const info = await this.getMeetingInfo(meetingID);
      if (!info || !info.running) {
        return [];
      }

      // Get full meeting info with attendees
      const xml = await this.request("getMeetingInfo", { meetingID });
      
      const attendees: Array<{
        userID: string;
        fullName: string;
        role: "MODERATOR" | "VIEWER";
        isPresenter: boolean;
        isListeningOnly: boolean;
      }> = [];

      // Parse attendees from XML
      const attendeeRegex = /<attendee>([\s\S]*?)<\/attendee>/g;
      let match;
      while ((match = attendeeRegex.exec(xml)) !== null) {
        const attendeeXml = match[1];
        
        const userIDMatch = attendeeXml.match(/<userID>([^<]+)<\/userID>/);
        const fullNameMatch = attendeeXml.match(/<fullName>([^<]+)<\/fullName>/);
        const roleMatch = attendeeXml.match(/<role>([^<]+)<\/role>/);
        const isPresenterMatch = attendeeXml.match(/<isPresenter>([^<]+)<\/isPresenter>/);
        const isListeningOnlyMatch = attendeeXml.match(/<isListeningOnly>([^<]+)<\/isListeningOnly>/);

        if (userIDMatch && fullNameMatch) {
          attendees.push({
            userID: userIDMatch[1],
            fullName: fullNameMatch[1],
            role: roleMatch?.[1] === "MODERATOR" ? "MODERATOR" : "VIEWER",
            isPresenter: isPresenterMatch?.[1] === "true",
            isListeningOnly: isListeningOnlyMatch?.[1] === "true",
          });
        }
      }

      return attendees;
    } catch (err) {
      console.error("[BBB] Error fetching attendees:", err);
      return [];
    }
  }

  /**
   * Get the server URL (base, without /bigbluebutton/api)
   */
  getServerUrl(): string {
    return this.serverUrl.replace("/bigbluebutton/api", "");
  }
}

