/**
 * Adobe Connect API Client
 * Handles authentication, meeting creation, and user management
 * Documentation: https://helpx.adobe.com/adobe-connect/webservices/introduction-connect-web-services.html
 */

// Note: For Adobe Connect servers with self-signed certificates,
// we need to disable TLS verification. This is handled per-request.

interface AdobeConnectMeeting {
  scoId: string;
  name: string;
  urlPath: string;
  meetingUrl: string;
}

interface AdobeConnectSession {
  sessionCookie: string;
  expiresAt: Date;
}

export class AdobeConnectApiClient {
  private serverUrl: string;
  private username: string;
  private password: string;
  private session: AdobeConnectSession | null = null;

  constructor(serverUrl: string, username: string, password: string) {
    // Remove trailing slash from server URL
    this.serverUrl = serverUrl.replace(/\/+$/, "");
    this.username = username;
    this.password = password;
  }

  /**
   * Parse XML response from Adobe Connect API
   * Returns an object with status and relevant data
   */
  private parseXmlResponse(xml: string): {
    ok: boolean;
    code?: string;
    subcode?: string;
    scoId?: string;
    urlPath?: string;
    sessionCookie?: string;
    principalId?: string;
    error?: string;
  } {
    // Check for status code
    const statusMatch = xml.match(/<status code="([^"]+)"(?:\s+subcode="([^"]+)")?/);
    const code = statusMatch?.[1] || "";
    const subcode = statusMatch?.[2] || "";

    // Check if OK
    const ok = code === "ok";

    // Extract sco-id from sco element
    const scoIdMatch = xml.match(/<sco[^>]*\ssco-id="([^"]+)"/);
    const scoId = scoIdMatch?.[1];

    // Extract url-path
    const urlPathMatch = xml.match(/<url-path>([^<]+)<\/url-path>/);
    const urlPath = urlPathMatch?.[1];

    // Extract session cookie from common-info response
    // Format: <cookie>breezbreezxtwytognzr4crdfr</cookie>
    // The cookie value itself is the BREEZESESSION value (not prefixed)
    let sessionCookie: string | undefined;
    const cookieMatch = xml.match(/<cookie>([^<]+)<\/cookie>/);
    if (cookieMatch?.[1]) {
      sessionCookie = cookieMatch[1];
    }

    // Extract principal-id
    const principalIdMatch = xml.match(/principal-id="([^"]+)"/);
    const principalId = principalIdMatch?.[1];

    return {
      ok,
      code,
      subcode,
      scoId,
      urlPath,
      sessionCookie,
      principalId,
      error: !ok ? `Adobe Connect error: ${code}${subcode ? ` (${subcode})` : ""}` : undefined,
    };
  }

  /**
   * Make an API request to Adobe Connect
   */
  private async request(
    action: string,
    params: Record<string, string> = {},
    sessionCookie?: string
  ): Promise<{ xml: string; cookies?: string }> {
    const url = new URL(`${this.serverUrl}/api/xml`);
    url.searchParams.set("action", action);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {};

    // Include session cookie if provided
    if (sessionCookie) {
      headers["Cookie"] = `BREEZESESSION=${sessionCookie}`;
    }

    console.log(`[AdobeConnect] Request: ${action}`, { 
      url: url.toString().replace(/password=[^&]+/, 'password=***'),
      hasSession: !!sessionCookie 
    });

    try {
      // Temporarily disable SSL verification for Adobe Connect servers with self-signed certificates
      const originalTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      if (url.toString().startsWith("https://")) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      }
      
      let response: Response;
      try {
        response = await fetch(url.toString(), {
          method: "GET",
          headers,
        });
      } finally {
        // Restore original setting
        if (originalTlsSetting !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsSetting;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
      }

      // Get cookies from response
      const cookies = response.headers.get("set-cookie") || "";

      if (!response.ok) {
        console.error(`[AdobeConnect] HTTP error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`[AdobeConnect] Response for ${action}:`, text.substring(0, 500));
      return { xml: text, cookies };
    } catch (error) {
      console.error(`[AdobeConnect] API request error (${action}):`, error);
      throw error;
    }
  }

  /**
   * Login and obtain session cookie
   * Adobe Connect login flow:
   * 1. Call common-info to get a session cookie
   * 2. Call login with that session cookie
   * 3. Use the same session cookie for subsequent requests
   */
  async login(): Promise<void> {
    // Check if we have a valid session
    if (this.session && this.session.expiresAt > new Date()) {
      return;
    }

    console.log("[AdobeConnect] Starting login process...");

    // Step 1: Get initial session from common-info
    const commonInfoResult = await this.request("common-info", {});
    let sessionCookie = this.extractSessionFromCookies(commonInfoResult.cookies);
    
    // Also try to extract from XML response
    if (!sessionCookie) {
      const parsed = this.parseXmlResponse(commonInfoResult.xml);
      sessionCookie = parsed.sessionCookie;
    }

    console.log("[AdobeConnect] Got session from common-info:", sessionCookie ? "yes" : "no");

    if (!sessionCookie) {
      throw new Error("Failed to obtain initial session from Adobe Connect");
    }

    // Step 2: Login with the session cookie
    const loginResult = await this.request(
      "login",
      {
        login: this.username,
        password: this.password,
      },
      sessionCookie
    );

    const loginParsed = this.parseXmlResponse(loginResult.xml);
    console.log("[AdobeConnect] Login result:", loginParsed.ok ? "success" : loginParsed.error);

    if (!loginParsed.ok) {
      throw new Error(loginParsed.error || "Failed to login to Adobe Connect");
    }

    // The session cookie remains the same after login, just now it's authenticated
    this.session = {
      sessionCookie,
      expiresAt: new Date(Date.now() + 25 * 60 * 1000), // 25 minutes to be safe
    };

    console.log("[AdobeConnect] Login successful, session stored");
  }

  /**
   * Extract BREEZESESSION from Set-Cookie header
   */
  private extractSessionFromCookies(cookies?: string): string | undefined {
    if (!cookies) return undefined;
    const match = cookies.match(/BREEZESESSION=([^;]+)/);
    return match?.[1];
  }

  /**
   * Ensure we're logged in before making API calls
   */
  private async ensureLoggedIn(): Promise<void> {
    if (!this.session || this.session.expiresAt <= new Date()) {
      await this.login();
    }
  }

  /**
   * Make an authenticated request (ensures login first)
   */
  private async authRequest(
    action: string,
    params: Record<string, string> = {}
  ): Promise<string> {
    await this.ensureLoggedIn();
    const result = await this.request(action, params, this.session!.sessionCookie);
    return result.xml;
  }

  /**
   * Get user's meetings folder (my-meetings)
   */
  async getMyMeetingsFolder(): Promise<string> {
    const xml = await this.authRequest("sco-shortcuts", {});
    const result = this.parseXmlResponse(xml);

    if (!result.ok) {
      throw new Error(result.error || "Failed to get shortcuts");
    }

    // Find my-meetings folder
    // Format: <sco tree-id="11004" sco-id="24156" type="my-meetings">
    const myMeetingsMatch = xml.match(/<sco[^>]+type="my-meetings"[^>]*>/);
    if (myMeetingsMatch) {
      const scoIdMatch = myMeetingsMatch[0].match(/sco-id="([^"]+)"/);
      if (scoIdMatch?.[1]) {
        console.log("[AdobeConnect] Found my-meetings folder:", scoIdMatch[1]);
        return scoIdMatch[1];
      }
    }
    
    // Try alternative pattern - sco-id before type
    const altMatch = xml.match(/sco-id="([^"]+)"[^>]*type="my-meetings"/);
    if (altMatch?.[1]) {
      console.log("[AdobeConnect] Found my-meetings folder (alt):", altMatch[1]);
      return altMatch[1];
    }
    
    console.error("[AdobeConnect] my-meetings folder not found in:", xml.substring(0, 500));
    throw new Error("Could not find my-meetings folder");
  }

  /**
   * Create a new meeting room
   */
  async createMeeting(params: {
    name: string;
    description?: string;
    folderId?: string;
    urlPath?: string;
  }): Promise<AdobeConnectMeeting> {
    // Get folder ID if not provided
    let folderId = params.folderId;
    if (!folderId) {
      folderId = await this.getMyMeetingsFolder();
    }

    // Generate a unique URL path if not provided
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const urlPath = params.urlPath || `meeting-${timestamp}-${randomStr}`;

    // Make the meeting name unique by appending timestamp
    // Adobe Connect doesn't allow duplicate names in the same folder
    const uniqueName = `${params.name} (${timestamp})`;

    // Create the meeting using sco-update
    // type=meeting for meeting rooms
    const xml = await this.authRequest("sco-update", {
      "folder-id": folderId,
      type: "meeting",
      name: uniqueName,
      description: params.description || "",
      "url-path": urlPath,
      "date-begin": new Date().toISOString(),
      // Make it accessible to anyone with the link
      "source-sco-id": "", // No template
    });

    const result = this.parseXmlResponse(xml);

    if (!result.ok) {
      // If duplicate name error, try with a different random suffix
      if (result.subcode === "duplicate") {
        const retryName = `${params.name} (${timestamp}-${randomStr})`;
        const retryXml = await this.authRequest("sco-update", {
          "folder-id": folderId,
          type: "meeting",
          name: retryName,
          description: params.description || "",
          "url-path": urlPath + "-retry",
          "date-begin": new Date().toISOString(),
          "source-sco-id": "",
        });
        
        const retryResult = this.parseXmlResponse(retryXml);
        if (!retryResult.ok) {
          throw new Error(retryResult.error || "Failed to create meeting (retry also failed)");
        }
        
        if (!retryResult.scoId) {
          throw new Error("Meeting created but no sco-id returned");
        }

        // Set permissions to allow anyone with link to enter
        await this.setMeetingPermissions(retryResult.scoId, "view-hidden");

        const retryUrlPath = urlPath + "-retry";
        return {
          scoId: retryResult.scoId,
          name: retryName,
          urlPath: retryUrlPath,
          meetingUrl: `${this.serverUrl}/${retryUrlPath}`,
        };
      }
      throw new Error(result.error || "Failed to create meeting");
    }

    if (!result.scoId) {
      throw new Error("Meeting created but no sco-id returned");
    }

    // Set permissions to allow anyone with link to enter
    await this.setMeetingPermissions(result.scoId, "view-hidden");

    // Construct the full meeting URL
    const meetingUrl = `${this.serverUrl}/${urlPath}`;

    return {
      scoId: result.scoId,
      name: uniqueName,
      urlPath: urlPath,
      meetingUrl,
    };
  }

  /**
   * Set meeting permissions
   * permission-id options:
   * - "view-hidden": Anyone with URL can view (guest access)
   * - "remove": Remove access
   * - "view": Can view
   * - "host": Host access
   * - "mini-host": Presenter access
   * - "denied": Denied access
   */
  async setMeetingPermissions(
    scoId: string,
    permissionId: string,
    principalId: string = "public-access"
  ): Promise<void> {
    const xml = await this.authRequest("permissions-update", {
      "acl-id": scoId,
      "principal-id": principalId,
      "permission-id": permissionId,
    });

    const result = this.parseXmlResponse(xml);

    if (!result.ok) {
      console.warn(`Failed to set permissions: ${result.error}`);
      // Don't throw - meeting is still usable
    }
  }

  /**
   * Get meeting info by sco-id
   */
  async getMeetingInfo(scoId: string): Promise<{
    name: string;
    urlPath: string;
    meetingUrl: string;
  } | null> {
    const xml = await this.authRequest("sco-info", {
      "sco-id": scoId,
    });

    const result = this.parseXmlResponse(xml);

    if (!result.ok) {
      return null;
    }

    // Extract name
    const nameMatch = xml.match(/<name>([^<]+)<\/name>/);
    const name = nameMatch?.[1] || "";

    // Extract url-path
    const urlPath = result.urlPath || "";

    return {
      name,
      urlPath,
      meetingUrl: `${this.serverUrl}/${urlPath}`,
    };
  }

  /**
   * Generate a guest login URL for a meeting
   * This creates a URL that allows anyone to join with a given name
   */
  generateGuestUrl(urlPath: string, guestName: string): string {
    // Adobe Connect allows guest access via the meeting URL
    // The user will be prompted to enter their name when they join
    const meetingUrl = `${this.serverUrl}/${urlPath.replace(/^\//, "")}`;
    return meetingUrl;
  }

  /**
   * Generate a login URL with session for authenticated users
   * This is for users who have Adobe Connect accounts
   */
  async generateAuthenticatedUrl(
    urlPath: string,
    loginAsUser?: { username: string; password: string }
  ): Promise<string> {
    // If we want to log in as a specific user, we'd need their credentials
    // For now, return the direct meeting URL
    const meetingUrl = `${this.serverUrl}/${urlPath.replace(/^\//, "")}`;

    if (this.session?.sessionCookie) {
      // Add session to URL for authenticated access
      return `${meetingUrl}?session=${this.session.sessionCookie}`;
    }

    return meetingUrl;
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(scoId: string): Promise<boolean> {
    const xml = await this.authRequest("sco-delete", {
      "sco-id": scoId,
    });

    const result = this.parseXmlResponse(xml);
    return result.ok;
  }

  /**
   * Get the direct meeting URL for joining
   */
  getMeetingUrl(urlPath: string): string {
    return `${this.serverUrl}/${urlPath.replace(/^\//, "")}`;
  }

  /**
   * Search for a user by login (email)
   * Returns the principal-id and actual login if found, null otherwise
   */
  async findUserByLogin(login: string): Promise<{ principalId: string; actualLogin: string } | null> {
    // Also try email format
    const searchTerm = login.includes("@") ? login : `${login.replace(/[^a-z0-9]/gi, '')}@school.edu`;
    
    const xml = await this.authRequest("principal-list", {
      "filter-login": searchTerm,
    });

    const result = this.parseXmlResponse(xml);
    if (!result.ok) {
      return null;
    }

    // Extract principal-id from the response
    const principalMatch = xml.match(/<principal[^>]+principal-id="([^"]+)"/);
    const loginMatch = xml.match(/<login>([^<]+)<\/login>/);
    
    if (principalMatch?.[1]) {
      return {
        principalId: principalMatch[1],
        actualLogin: loginMatch?.[1] || searchTerm,
      };
    }
    return null;
  }

  /**
   * Create a new user in Adobe Connect
   * Returns the principal-id of the created user
   */
  async createUser(params: {
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    type?: "user" | "guest";
  }): Promise<{ principalId: string; actualLogin: string }> {
    // Generate a valid-looking email if not provided
    // Adobe Connect uses email as the actual login for users
    const email = params.email || `${params.login.replace(/[^a-z0-9]/gi, '')}@school.edu`;
    
    const xml = await this.authRequest("principal-update", {
      "first-name": params.firstName,
      "last-name": params.lastName,
      login: email, // Use email as login - Adobe Connect requires this
      password: params.password,
      email,
      type: params.type || "user",
      "has-children": "0",
    });

    const result = this.parseXmlResponse(xml);

    if (!result.ok) {
      throw new Error(result.error || "Failed to create user");
    }

    if (!result.principalId) {
      throw new Error("User created but no principal-id returned");
    }

    // Extract the actual login from response (Adobe Connect uses email as login)
    const loginMatch = xml.match(/<login>([^<]+)<\/login>/);
    const actualLogin = loginMatch?.[1] || email;

    console.log(`[AdobeConnect] Created user ${actualLogin} with principal-id: ${result.principalId}`);
    return { principalId: result.principalId, actualLogin };
  }

  /**
   * Get or create a user in Adobe Connect
   * Returns { principalId, actualLogin } - actualLogin is the email used for login
   */
  async getOrCreateUser(params: {
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
  }): Promise<{ principalId: string; actualLogin: string }> {
    // First, try to find existing user
    const existing = await this.findUserByLogin(params.login);
    if (existing) {
      console.log(`[AdobeConnect] Found existing user ${existing.actualLogin}: ${existing.principalId}`);
      return existing;
    }

    // Create new user
    return this.createUser(params);
  }

  /**
   * Add a user to a meeting with specific permissions
   * @param scoId - The meeting sco-id
   * @param principalId - The user's principal-id
   * @param permission - Permission level: "host" (full control), "mini-host" (presenter), "view" (participant), "remove" (remove access)
   */
  async addUserToMeeting(
    scoId: string,
    principalId: string,
    permission: "host" | "mini-host" | "view" | "remove" = "view"
  ): Promise<void> {
    const xml = await this.authRequest("permissions-update", {
      "acl-id": scoId,
      "principal-id": principalId,
      "permission-id": permission,
    });

    const result = this.parseXmlResponse(xml);

    if (!result.ok) {
      console.warn(`[AdobeConnect] Failed to set user permission: ${result.error}`);
      // Don't throw - user might still be able to join
    } else {
      console.log(`[AdobeConnect] Added user ${principalId} to meeting ${scoId} with permission: ${permission}`);
    }
  }

  /**
   * Create a login session for a specific user and return a URL with the session
   * This allows the user to join the meeting as themselves
   */
  async createUserSession(
    userLogin: string,
    userPassword: string,
    meetingUrlPath: string
  ): Promise<string> {
    // Get a new session cookie first
    const commonInfoResult = await this.request("common-info", {});
    let sessionCookie = this.extractSessionFromCookies(commonInfoResult.cookies);
    
    if (!sessionCookie) {
      const parsed = this.parseXmlResponse(commonInfoResult.xml);
      sessionCookie = parsed.sessionCookie;
    }

    if (!sessionCookie) {
      throw new Error("Failed to obtain session for user login");
    }

    // Login as the specific user
    const loginResult = await this.request(
      "login",
      {
        login: userLogin,
        password: userPassword,
      },
      sessionCookie
    );

    const loginParsed = this.parseXmlResponse(loginResult.xml);

    if (!loginParsed.ok) {
      console.error(`[AdobeConnect] User login failed: ${loginParsed.error}`);
      // Fall back to meeting URL without session
      return `${this.serverUrl}/${meetingUrlPath.replace(/^\//, "")}`;
    }

    // Return the meeting URL with the authenticated session
    return `${this.serverUrl}/${meetingUrlPath.replace(/^\//, "")}?session=${sessionCookie}`;
  }

  /**
   * Get the server URL
   */
  getServerUrl(): string {
    return this.serverUrl;
  }

  /**
   * Get meeting statistics including current users count
   * Uses sco-info and various reports
   */
  async getMeetingStats(scoId: string): Promise<{
    name: string;
    urlPath: string;
    dateBegin?: string;
    dateEnd?: string;
    dateCreated?: string;
    dateModified?: string;
    currentUsers: number;
    isActive: boolean;
    totalRecordings?: number;
  }> {
    await this.login();

    // Get SCO info
    const scoInfoResult = await this.authRequest("sco-info", { "sco-id": scoId });
    
    const nameMatch = scoInfoResult.match(/<name>([^<]*)<\/name>/);
    const urlPathMatch = scoInfoResult.match(/<url-path>([^<]*)<\/url-path>/);
    const dateBeginMatch = scoInfoResult.match(/<date-begin>([^<]*)<\/date-begin>/);
    const dateEndMatch = scoInfoResult.match(/<date-end>([^<]*)<\/date-end>/);
    const dateCreatedMatch = scoInfoResult.match(/<date-created>([^<]*)<\/date-created>/);
    const dateModifiedMatch = scoInfoResult.match(/<date-modified>([^<]*)<\/date-modified>/);

    // Get current users in meeting
    let currentUsers = 0;
    let isActive = false;

    // Try to get current attendees
    try {
      const attendees = await this.getCurrentAttendees(scoId);
      currentUsers = attendees.length;
      isActive = currentUsers > 0;
    } catch (err) {
      // If that fails, try alternative methods
      try {
        // Try meeting-usage-report
        const usageResult = await this.authRequest("meeting-usage-report", { "sco-id": scoId });
        const activeMatch = usageResult.match(/<row[^>]*>/g);
        if (activeMatch) {
          isActive = true;
          currentUsers = activeMatch.length;
        }
      } catch {
        // Meeting might not be active or API not available
        // Check if meeting time suggests it should be active
        if (dateBeginMatch && dateEndMatch) {
          const beginDate = new Date(dateBeginMatch[1]);
          const endDate = new Date(dateEndMatch[1]);
          const now = new Date();
          isActive = now >= beginDate && now <= endDate;
        }
      }
    }

    // Get recordings count
    let totalRecordings = 0;
    try {
      const recordings = await this.getMeetingRecordings(scoId);
      totalRecordings = recordings.length;
    } catch {
      // Ignore errors
    }

    return {
      name: nameMatch?.[1] || "",
      urlPath: urlPathMatch?.[1] || "",
      dateBegin: dateBeginMatch?.[1],
      dateEnd: dateEndMatch?.[1],
      dateCreated: dateCreatedMatch?.[1],
      dateModified: dateModifiedMatch?.[1],
      currentUsers,
      isActive,
      totalRecordings,
    };
  }

  /**
   * Get recordings for a meeting
   * Recordings are stored as SCOs in the meeting folder
   */
  async getMeetingRecordings(scoId: string): Promise<Array<{
    scoId: string;
    name: string;
    dateCreated: string;
    duration?: number;
    playbackUrl: string;
  }>> {
    await this.login();

    try {
      // Get contents of meeting folder - recordings are type="content" with icon="archive"
      const contentsResult = await this.authRequest("sco-contents", { 
        "sco-id": scoId,
        "filter-icon": "archive"
      });

      const recordings: Array<{
        scoId: string;
        name: string;
        dateCreated: string;
        duration?: number;
        playbackUrl: string;
      }> = [];

      // Parse recordings from response - Adobe Connect returns <sco> tags, not <row>
      // Format: <sco sco-id="..." type="content" icon="archive" ...>...</sco>
      const scoRegex = /<sco[^>]*sco-id="([^"]+)"[^>]*icon="archive"[^>]*>([\s\S]*?)<\/sco>/g;
      let match;
      
      while ((match = scoRegex.exec(contentsResult)) !== null) {
        const recordingScoId = match[1];
        const scoContent = match[2];
        const fullMatch = match[0]; // Full match including opening tag
        
        // Extract fields from the sco content
        const nameMatch = scoContent.match(/<name>([^<]*)<\/name>/);
        const urlPathMatch = scoContent.match(/<url-path>([^<]*)<\/url-path>/);
        const dateCreatedMatch = scoContent.match(/<date-created>([^<]*)<\/date-created>/);
        // Duration can be in attribute (in opening tag) or calculated from date-begin/date-end
        const durationAttrMatch = fullMatch.match(/duration="([^"]+)"/);
        const dateBeginMatch = scoContent.match(/<date-begin>([^<]*)<\/date-begin>/);
        const dateEndMatch = scoContent.match(/<date-end>([^<]*)<\/date-end>/);
        
        let duration: number | undefined = undefined;
        if (durationAttrMatch) {
          duration = parseInt(durationAttrMatch[1]);
        } else if (dateBeginMatch && dateEndMatch) {
          // Calculate duration from dates (in seconds, convert to minutes)
          const begin = new Date(dateBeginMatch[1]);
          const end = new Date(dateEndMatch[1]);
          if (!isNaN(begin.getTime()) && !isNaN(end.getTime())) {
            duration = Math.round((end.getTime() - begin.getTime()) / 1000 / 60);
          }
        }
        
        if (nameMatch && urlPathMatch) {
          const name = nameMatch[1];
          const urlPath = urlPathMatch[1];
          const dateCreated = dateCreatedMatch?.[1] || "";

          recordings.push({
            scoId: recordingScoId,
            name,
            dateCreated,
            duration,
            playbackUrl: `${this.serverUrl}${urlPath}`,
          });
        }
      }

      // If no results with archive filter, try getting all content and filter manually
      if (recordings.length === 0) {
        const allContentsResult = await this.authRequest("sco-contents", { "sco-id": scoId });
        
        // Look for archive/recording type items - check for icon="archive" or type="content"
        const allScoRegex = /<sco[^>]*sco-id="([^"]+)"[^>]*(?:icon="archive"|type="content")[^>]*>([\s\S]*?)<\/sco>/g;
        while ((match = allScoRegex.exec(allContentsResult)) !== null) {
          const recordingScoId = match[1];
          const scoContent = match[2];
          const fullMatch = match[0]; // Full match including opening tag
          
          // Check if it's actually an archive (has icon="archive" attribute or in name)
          if (!scoContent.includes('icon="archive"') && !scoContent.match(/<name>.*archive.*<\/name>/i)) {
            continue;
          }
          
          const nameMatch = scoContent.match(/<name>([^<]*)<\/name>/);
          const urlPathMatch = scoContent.match(/<url-path>([^<]*)<\/url-path>/);
          const dateCreatedMatch = scoContent.match(/<date-created>([^<]*)<\/date-created>/);
          const durationAttrMatch = fullMatch.match(/duration="([^"]+)"/);
          const dateBeginMatch = scoContent.match(/<date-begin>([^<]*)<\/date-begin>/);
          const dateEndMatch = scoContent.match(/<date-end>([^<]*)<\/date-end>/);
          
          let duration: number | undefined = undefined;
          if (durationAttrMatch) {
            duration = parseInt(durationAttrMatch[1]);
          } else if (dateBeginMatch && dateEndMatch) {
            const begin = new Date(dateBeginMatch[1]);
            const end = new Date(dateEndMatch[1]);
            if (!isNaN(begin.getTime()) && !isNaN(end.getTime())) {
              duration = Math.round((end.getTime() - begin.getTime()) / 1000 / 60);
            }
          }
          
          if (nameMatch && urlPathMatch) {
            recordings.push({
              scoId: recordingScoId,
              name: nameMatch[1],
              dateCreated: dateCreatedMatch?.[1] || "",
              duration,
              playbackUrl: `${this.serverUrl}${urlPathMatch[1]}`,
            });
          }
        }
      }

      return recordings;
    } catch (err) {
      console.error("[AdobeConnect] Error fetching recordings:", err);
      return [];
    }
  }

  /**
   * Get current attendees in a meeting
   * Note: Adobe Connect API doesn't always support filter-is-in-room
   * So we get all attendance records and filter by recent activity
   */
  async getCurrentAttendees(scoId: string): Promise<Array<{
    principalId: string;
    name: string;
    login: string;
    dateJoined?: string;
  }>> {
    await this.login();

    try {
      // Try with filter first
      let result: string;
      try {
        result = await this.authRequest("report-meeting-attendance", { 
          "sco-id": scoId,
          "filter-is-in-room": "true"
        });
      } catch {
        // If filter fails, get all attendance records
        result = await this.authRequest("report-meeting-attendance", { 
          "sco-id": scoId
        });
      }

      const attendees: Array<{
        principalId: string;
        name: string;
        login: string;
        dateJoined?: string;
      }> = [];

      // Parse rows from the response
      const rowRegex = /<row[^>]*principal-id="([^"]+)"[^>]*>([\s\S]*?)<\/row>/g;
      let match;
      
      while ((match = rowRegex.exec(result)) !== null) {
        const principalId = match[1];
        const rowContent = match[2];
        
        const nameMatch = rowContent.match(/<name>([^<]*)<\/name>/);
        const loginMatch = rowContent.match(/<login>([^<]*)<\/login>/);
        const dateCreatedMatch = rowContent.match(/<date-created>([^<]*)<\/date-created>/);
        const dateJoinedMatch = rowContent.match(/<date-joined>([^<]*)<\/date-joined>/);
        
        if (nameMatch && loginMatch) {
          attendees.push({
            principalId,
            name: nameMatch[1],
            login: loginMatch[1],
            dateJoined: dateJoinedMatch?.[1] || dateCreatedMatch?.[1],
          });
        }
      }

      // If we got all records (not filtered), try to filter by recent activity
      // Consider attendees active if they joined in the last 2 hours
      if (attendees.length > 0) {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        return attendees.filter(attendee => {
          if (!attendee.dateJoined) return false;
          const joinDate = new Date(attendee.dateJoined);
          return joinDate >= twoHoursAgo;
        });
      }

      return attendees;
    } catch (err) {
      console.error("[AdobeConnect] Error fetching attendees:", err);
      return [];
    }
  }
}

