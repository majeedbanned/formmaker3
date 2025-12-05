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
    const urlPath =
      params.urlPath ||
      `meeting-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create the meeting using sco-update
    // type=meeting for meeting rooms
    const xml = await this.authRequest("sco-update", {
      "folder-id": folderId,
      type: "meeting",
      name: params.name,
      description: params.description || "",
      "url-path": urlPath,
      "date-begin": new Date().toISOString(),
      // Make it accessible to anyone with the link
      "source-sco-id": "", // No template
    });

    const result = this.parseXmlResponse(xml);

    if (!result.ok) {
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
      name: params.name,
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
}

