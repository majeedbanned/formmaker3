using System;
using System.Collections.Generic;
using System.Web.Services;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Linq;

namespace FarsamoozPushNotification
{
    /// <summary>
    /// Web Service for sending push notifications via Expo
    /// </summary>
    [WebService(Namespace = "http://push.farsamooz.ir/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    [System.Web.Script.Services.ScriptService]
    public class SendNotif : System.Web.Services.WebService
    {
        private const string EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
        private static readonly HttpClient httpClient = new HttpClient();

        /// <summary>
        /// Send push notification to multiple tokens
        /// </summary>
        /// <param name="tokens">Array of Expo push tokens</param>
        /// <param name="title">Notification title</param>
        /// <param name="body">Notification body</param>
        /// <param name="data">Additional data (JSON string)</param>
        /// <returns>JSON response from Expo</returns>
        [WebMethod(Description = "Send push notifications to multiple Expo tokens")]
        public async Task<string> SendPushNotification(
            string[] tokens, 
            string title, 
            string body, 
            string data = null
        )
        {
            try
            {
                // Validate inputs
                if (tokens == null || tokens.Length == 0)
                {
                    return CreateErrorResponse("No tokens provided");
                }

                if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(body))
                {
                    return CreateErrorResponse("Title and body are required");
                }

                // Log request
                LogRequest(tokens.Length, title);

                // Prepare notifications
                var notifications = new List<ExpoNotification>();
                foreach (var token in tokens)
                {
                    if (!string.IsNullOrEmpty(token))
                    {
                        var notification = new ExpoNotification
                        {
                            to = token,
                            sound = "default",
                            title = title,
                            body = body,
                            data = ParseData(data)
                        };
                        notifications.Add(notification);
                    }
                }

                // Send to Expo
                var json = JsonConvert.SerializeObject(notifications);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await httpClient.PostAsync(EXPO_PUSH_ENDPOINT, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                // Log response
                LogResponse(response.IsSuccessStatusCode, responseBody);

                if (response.IsSuccessStatusCode)
                {
                    return CreateSuccessResponse(responseBody, tokens.Length);
                }
                else
                {
                   return CreateErrorResponse("Expo API error: " + response.StatusCode + " - " + responseBody);

                }
            }
            catch (Exception ex)
            {
                LogError(ex);
                return CreateErrorResponse("Server error: " + ex.Message);
            }
        }

        /// <summary>
        /// Batch send with detailed response for each token
        /// </summary>
        [WebMethod(Description = "Send push notifications with detailed response per token")]
        public async Task<SendNotificationResponse> SendPushNotificationBatch(
            string[] tokens,
            string title,
            string body,
            string data = null
        )
        {
            var response = new SendNotificationResponse
            {
                Success = false,
                TotalTokens = (tokens != null ? tokens.Length : 0),
                SentCount = 0,
                FailedCount = 0,
                Results = new List<NotificationResult>()
            };

            try
            {
                // Validate inputs
                if (tokens == null || tokens.Length == 0)
                {
                    response.ErrorMessage = "No tokens provided";
                    return response;
                }

                if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(body))
                {
                    response.ErrorMessage = "Title and body are required";
                    return response;
                }

                // Log request
                LogRequest(tokens.Length, title);

                // Prepare notifications
                var notifications = new List<ExpoNotification>();
                foreach (var token in tokens)
                {
                    if (!string.IsNullOrEmpty(token))
                    {
                        notifications.Add(new ExpoNotification
                        {
                            to = token,
                            sound = "default",
                            title = title,
                            body = body,
                            data = ParseData(data)
                        });
                    }
                }

                // Send to Expo
                var json = JsonConvert.SerializeObject(notifications);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var httpResponse = await httpClient.PostAsync(EXPO_PUSH_ENDPOINT, content);
                var responseBody = await httpResponse.Content.ReadAsStringAsync();

                // Parse Expo response
                var expoResponse = JsonConvert.DeserializeObject<ExpoResponse>(responseBody);

                if (httpResponse.IsSuccessStatusCode && expoResponse != null && expoResponse.data != null)
                {
                    response.Success = true;
                    response.ExpoResponse = responseBody;

                    for (int i = 0; i < expoResponse.data.Count && i < tokens.Length; i++)
                    {
                        var result = new NotificationResult
                        {
                            Token = tokens[i],
                            Status = expoResponse.data[i].status,
                            MessageId = expoResponse.data[i].id,
                            ErrorMessage = expoResponse.data[i].message
                        };

                        if (result.Status == "ok")
                        {
                            response.SentCount++;
                        }
                        else
                        {
                            response.FailedCount++;
                        }

                        response.Results.Add(result);
                    }

                   LogResponse(true, "Sent: " + response.SentCount + ", Failed: " + response.FailedCount);

                }
                else
                {
                    response.ErrorMessage = "Expo API error: " + httpResponse.StatusCode;
                    response.ExpoResponse = responseBody;
                    LogResponse(false, responseBody);
                }
            }
            catch (Exception ex)
            {
                response.ErrorMessage = ex.Message;
                LogError(ex);
            }

            return response;
        }

        /// <summary>
        /// Test endpoint to verify service is running
        /// </summary>
        [WebMethod(Description = "Test if service is running")]
        public string Ping()
        {
            return JsonConvert.SerializeObject(new
            {
                status = "ok",
                message = "Farsamooz Push Notification Service is running",
                timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                version = "1.0"
            });
        }

        #region Helper Methods

        private Dictionary<string, object> ParseData(string data)
        {
            if (string.IsNullOrEmpty(data))
                return new Dictionary<string, object>();

            try
            {
                return JsonConvert.DeserializeObject<Dictionary<string, object>>(data);
            }
            catch
            {
                return new Dictionary<string, object> { { "rawData", data } };
            }
        }

        private string CreateSuccessResponse(string expoResponse, int tokenCount)
        {
            return JsonConvert.SerializeObject(new
            {
                success = true,
                message = "Notifications sent successfully",
                tokenCount = tokenCount,
                expoResponse = expoResponse,
                timestamp = DateTime.Now
            });
        }

        private string CreateErrorResponse(string errorMessage)
        {
            return JsonConvert.SerializeObject(new
            {
                success = false,
                error = errorMessage,
                timestamp = DateTime.Now
            });
        }

        private void LogRequest(int tokenCount, string title)
        {
            // Log to file or database
            System.Diagnostics.Debug.WriteLine(
                "[" + DateTime.Now + "] Push notification request: " + tokenCount + " tokens, Title: " + title
            );
        }

        private void LogResponse(bool success, string response)
        {
            System.Diagnostics.Debug.WriteLine(
                "[" + DateTime.Now + "] Push notification response: Success=" + success + ", Response=" + response.Substring(0, Math.Min(200, response.Length))
            );
        }

        private void LogError(Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(
                "[" + DateTime.Now + "] Push notification error: " + ex.Message + "\n" + ex.StackTrace
            );
        }

        #endregion

        #region Models

        public class ExpoNotification
        {
            public string to { get; set; }
            public string sound { get; set; }
            public string title { get; set; }
            public string body { get; set; }
            public Dictionary<string, object> data { get; set; }
        }

        public class ExpoResponse
        {
            public List<ExpoResponseData> data { get; set; }
        }

        public class ExpoResponseData
        {
            public string status { get; set; }
            public string id { get; set; }
            public string message { get; set; }
            public ExpoResponseDetails details { get; set; }
        }

        public class ExpoResponseDetails
        {
            public string error { get; set; }
        }

        public class SendNotificationResponse
        {
            public bool Success { get; set; }
            public int TotalTokens { get; set; }
            public int SentCount { get; set; }
            public int FailedCount { get; set; }
            public string ErrorMessage { get; set; }
            public string ExpoResponse { get; set; }
            public List<NotificationResult> Results { get; set; }
        }

        public class NotificationResult
        {
            public string Token { get; set; }
            public string Status { get; set; }
            public string MessageId { get; set; }
            public string ErrorMessage { get; set; }
        }

        #endregion
    }
}

