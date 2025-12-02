/**
 * Skyroom API Client
 * Handles all interactions with the Skyroom Web Service API
 * Documentation: https://data.skyroom.online/help/webservice.html
 */

export interface SkyroomApiResponse<T = any> {
  ok: boolean;
  result?: T;
  error_code?: number;
  error_message?: string;
}

export interface SkyroomRoom {
  id: number;
  service_id: number;
  name: string;
  title: string;
  description?: string;
  status: number;
  guest_login: boolean;
  guest_limit: number;
  op_login_first: boolean;
  max_users: number;
  session_duration?: number;
  time_limit?: number;
  time_usage: number;
  time_total: number;
  create_time: number;
  update_time: number;
}

export interface SkyroomUser {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  fname?: string;
  lname?: string;
  gender?: number;
  status: number;
  is_public: boolean;
  concurrent: number;
  time_limit?: number;
  time_usage: number;
  time_total: number;
  expiry_date?: number;
  create_time: number;
  update_time: number;
}

export interface SkyroomService {
  id: number;
  title: string;
  status: number;
  user_limit: number;
  video_limit: number;
  time_limit?: number;
  time_usage: number;
  start_time: number;
  stop_time: number;
  create_time: number;
  update_time: number;
}

export class SkyroomApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.length !== 50) {
      throw new Error("Skyroom API key must be exactly 50 characters long");
    }
    this.apiKey = apiKey;
    this.baseUrl = `https://www.skyroom.online/skyroom/api/${apiKey}`;
  }

  /**
   * Make a request to the Skyroom API
   */
  private async request<T>(
    action: string,
    params: Record<string, any> = {}
  ): Promise<SkyroomApiResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          params,
        }),
      });

      // Check for HTTP errors (network/server errors)
      if (response.status !== 200) {
        throw new Error(
          `Skyroom API HTTP error: ${response.status} ${response.statusText}`
        );
      }

      const data: SkyroomApiResponse<T> = await response.json();

      // Check for API errors
      if (!data.ok) {
        throw new Error(
          `Skyroom API error: ${data.error_code} - ${data.error_message}`
        );
      }

      return data;
    } catch (error) {
      console.error("Skyroom API request error:", error);
      throw error;
    }
  }

  /**
   * Get list of services
   */
  async getServices(): Promise<SkyroomService[]> {
    const response = await this.request<SkyroomService[]>("getServices");
    return response.result || [];
  }

  /**
   * Get list of rooms
   */
  async getRooms(): Promise<SkyroomRoom[]> {
    const response = await this.request<SkyroomRoom[]>("getRooms");
    return response.result || [];
  }

  /**
   * Get room by ID or name
   */
  async getRoom(roomId?: number, name?: string): Promise<SkyroomRoom | null> {
    const params: Record<string, any> = {};
    if (roomId) params.room_id = roomId;
    if (name) params.name = name;

    if (!roomId && !name) {
      throw new Error("Either roomId or name must be provided");
    }

    const response = await this.request<SkyroomRoom>("getRoom", params);
    return response.result || null;
  }

  /**
   * Create a new room
   */
  async createRoom(params: {
    name: string;
    title: string;
    description?: string;
    service_id?: number;
    guest_login?: boolean;
    guest_limit?: number;
    op_login_first?: boolean;
    max_users?: number;
    session_duration?: number;
    time_limit?: number;
  }): Promise<number> {
    const response = await this.request<number>("createRoom", params);
    return response.result || 0;
  }

  /**
   * Update a room
   */
  async updateRoom(
    roomId: number,
    params: Partial<{
      title: string;
      description: string;
      status: number;
      guest_login: boolean;
      guest_limit: number;
      op_login_first: boolean;
      max_users: number;
      session_duration: number;
      time_limit: number;
    }>
  ): Promise<boolean> {
    const response = await this.request<number>("updateRoom", {
      room_id: roomId,
      ...params,
    });
    return response.result === 1;
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId: number): Promise<boolean> {
    const response = await this.request<number>("deleteRoom", { room_id: roomId });
    return response.result === 1;
  }

  /**
   * Get users in a room
   */
  async getRoomUsers(roomId: number): Promise<
    Array<{
      user_id: number;
      username: string;
      nickname: string;
      access: number;
    }>
  > {
    const response = await this.request<
      Array<{
        user_id: number;
        username: string;
        nickname: string;
        access: number;
      }>
    >("getRoomUsers", { room_id: roomId });
    return response.result || [];
  }

  /**
   * Add users to a room
   * access: 1 = normal user, 2 = presenter, 3 = operator, 4 = admin
   */
  async addRoomUsers(
    roomId: number,
    users: Array<{ user_id: number; access?: number }>
  ): Promise<number> {
    const response = await this.request<number>("addRoomUsers", {
      room_id: roomId,
      users,
    });
    return response.result || 0;
  }

  /**
   * Remove users from a room
   */
  async removeRoomUsers(
    roomId: number,
    userIds: number[]
  ): Promise<number> {
    const response = await this.request<number>("removeRoomUsers", {
      room_id: roomId,
      users: userIds,
    });
    return response.result || 0;
  }

  /**
   * Get list of users
   */
  async getUsers(): Promise<SkyroomUser[]> {
    const response = await this.request<SkyroomUser[]>("getUsers");
    return response.result || [];
  }

  /**
   * Get user by ID or username
   */
  async getUser(userId?: number, username?: string): Promise<SkyroomUser | null> {
    const params: Record<string, any> = {};
    if (userId) params.user_id = userId;
    if (username) params.username = username;

    if (!userId && !username) {
      throw new Error("Either userId or username must be provided");
    }

    // Note: When user is not found, Skyroom returns ok:false with error_code 15.
    // We want to treat that as \"not found\" (null) instead of throwing.
    try {
      const response = await this.request<SkyroomUser>("getUser", params);
      return response.result || null;
    } catch (error: any) {
      const message = (error && error.message) || String(error || "");
      if (message.includes("Skyroom API error: 15")) {
        // Data not found (e.g. user does not exist)
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(params: {
    username: string;
    password: string;
    nickname: string;
    email?: string;
    fname?: string;
    lname?: string;
    gender?: number;
    status?: number;
    is_public?: boolean;
    concurrent?: number;
    time_limit?: number;
    expiry_date?: number;
  }): Promise<number> {
    const response = await this.request<number>("createUser", params);
    return response.result || 0;
  }

  /**
   * Update a user
   */
  async updateUser(
    userId: number,
    params: Partial<{
      username: string;
      password: string;
      nickname: string;
      email: string;
      fname: string;
      lname: string;
      gender: number;
      status: number;
      is_public: boolean;
      concurrent: number;
      time_limit: number;
      expiry_date: number;
    }>
  ): Promise<boolean> {
    const response = await this.request<number>("updateUser", {
      user_id: userId,
      ...params,
    });
    return response.result === 1;
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: number): Promise<boolean> {
    const response = await this.request<number>("deleteUser", { user_id: userId });
    return response.result === 1;
  }

  /**
   * Get rooms for a user
   */
  async getUserRooms(userId: number): Promise<
    Array<{
      room_id: number;
      name: string;
      title: string;
      access: number;
    }>
  > {
    const response = await this.request<
      Array<{
        room_id: number;
        name: string;
        title: string;
        access: number;
      }>
    >("getUserRooms", { user_id: userId });
    return response.result || [];
  }

  /**
   * Add rooms to a user
   */
  async addUserRooms(
    userId: number,
    rooms: Array<{ room_id: number; access?: number }>
  ): Promise<number> {
    const response = await this.request<number>("addUserRooms", {
      user_id: userId,
      rooms,
    });
    return response.result || 0;
  }

  /**
   * Remove rooms from a user
   */
  async removeUserRooms(
    userId: number,
    roomIds: number[]
  ): Promise<number> {
    const response = await this.request<number>("removeUserRooms", {
      user_id: userId,
      rooms: roomIds,
    });
    return response.result || 0;
  }

  /**
   * Create a login URL for direct access to a room
   * This is the recommended way to generate join links
   */
  async createLoginUrl(params: {
    room_id: number;
    user_id: string; // Can be string or number, used to prevent concurrent logins
    nickname: string;
    access?: number; // 1 = normal, 2 = presenter, 3 = operator, 4 = admin
    concurrent?: number; // Max concurrent logins with this link (default: 1)
    language?: string; // "fa" or "en" (default: "fa")
    ttl?: number; // Time to live in seconds (default: 3600 = 1 hour)
  }): Promise<string> {
    const response = await this.request<string>("createLoginUrl", params);
    return response.result || "";
  }

  /**
   * Get room URL
   */
  async getRoomUrl(roomId: number, language: string = "fa"): Promise<string> {
    const response = await this.request<string>("getRoomUrl", {
      room_id: roomId,
      language,
    });
    return response.result || "";
  }
}

