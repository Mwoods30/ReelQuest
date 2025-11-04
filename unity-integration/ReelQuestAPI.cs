using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class LoginRequest
{
    public string email;
    public string password;
}

[System.Serializable]
public class SignupRequest
{
    public string name;
    public string username;
    public string email;
    public string password;
}

[System.Serializable]
public class AuthResponse
{
    public string status;
    public string token;
    public UserData data;
}

[System.Serializable]
public class UserData
{
    public User user;
}

[System.Serializable]
public class User
{
    public string _id;
    public string name;
    public string username;
    public string email;
    public string avatar;
    public GameStats gameStats;
    public DateTime createdAt;
    public DateTime lastLogin;
}

[System.Serializable]
public class GameStats
{
    public int gamesPlayed;
    public int totalScore;
    public int highScore;
    public int totalCatches;
    public int rareFishCaught;
    public int totalPlayTime;
    public int level;
    public int experience;
    public Achievement[] achievements;
}

[System.Serializable]
public class Achievement
{
    public string name;
    public string description;
    public DateTime unlockedAt;
}

[System.Serializable]
public class ApiResponse<T>
{
    public string status;
    public string message;
    public T data;
}

public class ReelQuestAPI : MonoBehaviour
{
    [Header("API Configuration")]
    public string baseURL = "http://localhost:5000/api";
    
    private string authToken;
    private User currentUser;
    
    // Events for UI updates
    public static event System.Action<User> OnUserLoggedIn;
    public static event System.Action OnUserLoggedOut;
    public static event System.Action<string> OnApiError;
    
    // Singleton pattern
    public static ReelQuestAPI Instance { get; private set; }
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            // Load saved token if exists
            authToken = PlayerPrefs.GetString("AuthToken", "");
            
            if (!string.IsNullOrEmpty(authToken))
            {
                StartCoroutine(ValidateToken());
            }
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    // Authentication Methods
    public void SignUp(string name, string username, string email, string password, System.Action<bool> callback)
    {
        var request = new SignupRequest
        {
            name = name,
            username = username,
            email = email,
            password = password
        };
        
        StartCoroutine(PostRequest<AuthResponse>("/auth/signup", request, (response, success) =>
        {
            if (success && response.status == "success")
            {
                SetAuthToken(response.token);
                currentUser = response.data.user;
                OnUserLoggedIn?.Invoke(currentUser);
                callback?.Invoke(true);
            }
            else
            {
                OnApiError?.Invoke("Signup failed: " + response.message);
                callback?.Invoke(false);
            }
        }));
    }
    
    public void Login(string email, string password, System.Action<bool> callback)
    {
        var request = new LoginRequest
        {
            email = email,
            password = password
        };
        
        StartCoroutine(PostRequest<AuthResponse>("/auth/login", request, (response, success) =>
        {
            if (success && response.status == "success")
            {
                SetAuthToken(response.token);
                currentUser = response.data.user;
                OnUserLoggedIn?.Invoke(currentUser);
                callback?.Invoke(true);
            }
            else
            {
                OnApiError?.Invoke("Login failed: " + (response?.message ?? "Network error"));
                callback?.Invoke(false);
            }
        }));
    }
    
    public void Logout(System.Action<bool> callback = null)
    {
        StartCoroutine(PostRequest<ApiResponse<object>>("/auth/logout", null, (response, success) =>
        {
            ClearAuthToken();
            currentUser = null;
            OnUserLoggedOut?.Invoke();
            callback?.Invoke(success);
        }));
    }
    
    // User Profile Methods
    public void GetUserProfile(System.Action<User> callback)
    {
        StartCoroutine(GetRequest<ApiResponse<User>>("/users/profile", (response, success) =>
        {
            if (success && response.status == "success")
            {
                currentUser = response.data;
                callback?.Invoke(currentUser);
            }
            else
            {
                OnApiError?.Invoke("Failed to get user profile");
                callback?.Invoke(null);
            }
        }));
    }
    
    public void UpdateUserProfile(User updatedUser, System.Action<bool> callback)
    {
        StartCoroutine(PatchRequest<ApiResponse<User>>("/users/profile", updatedUser, (response, success) =>
        {
            if (success && response.status == "success")
            {
                currentUser = response.data;
                callback?.Invoke(true);
            }
            else
            {
                OnApiError?.Invoke("Failed to update profile");
                callback?.Invoke(false);
            }
        }));
    }
    
    // Helper Methods
    private void SetAuthToken(string token)
    {
        authToken = token;
        PlayerPrefs.SetString("AuthToken", token);
        PlayerPrefs.Save();
    }
    
    private void ClearAuthToken()
    {
        authToken = "";
        PlayerPrefs.DeleteKey("AuthToken");
        PlayerPrefs.Save();
    }
    
    private IEnumerator ValidateToken()
    {
        yield return StartCoroutine(GetRequest<ApiResponse<User>>("/users/profile", (response, success) =>
        {
            if (success && response.status == "success")
            {
                currentUser = response.data;
                OnUserLoggedIn?.Invoke(currentUser);
            }
            else
            {
                ClearAuthToken();
            }
        }));
    }
    
    // Generic HTTP Methods
    private IEnumerator GetRequest<T>(string endpoint, System.Action<T, bool> callback)
    {
        string url = baseURL + endpoint;
        
        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            if (!string.IsNullOrEmpty(authToken))
            {
                request.SetRequestHeader("Authorization", "Bearer " + authToken);
            }
            
            request.SetRequestHeader("Content-Type", "application/json");
            
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    T response = JsonUtility.FromJson<T>(request.downloadHandler.text);
                    callback?.Invoke(response, true);
                }
                catch (System.Exception e)
                {
                    Debug.LogError("JSON Parse Error: " + e.Message);
                    callback?.Invoke(default(T), false);
                }
            }
            else
            {
                Debug.LogError("API Error: " + request.error);
                callback?.Invoke(default(T), false);
            }
        }
    }
    
    private IEnumerator PostRequest<T>(string endpoint, object data, System.Action<T, bool> callback)
    {
        string url = baseURL + endpoint;
        string jsonData = data != null ? JsonUtility.ToJson(data) : "{}";
        
        using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            
            if (!string.IsNullOrEmpty(authToken))
            {
                request.SetRequestHeader("Authorization", "Bearer " + authToken);
            }
            
            request.SetRequestHeader("Content-Type", "application/json");
            
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    T response = JsonUtility.FromJson<T>(request.downloadHandler.text);
                    callback?.Invoke(response, true);
                }
                catch (System.Exception e)
                {
                    Debug.LogError("JSON Parse Error: " + e.Message);
                    callback?.Invoke(default(T), false);
                }
            }
            else
            {
                Debug.LogError("API Error: " + request.error);
                callback?.Invoke(default(T), false);
            }
        }
    }
    
    private IEnumerator PatchRequest<T>(string endpoint, object data, System.Action<T, bool> callback)
    {
        string url = baseURL + endpoint;
        string jsonData = JsonUtility.ToJson(data);
        
        using (UnityWebRequest request = new UnityWebRequest(url, "PATCH"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            
            if (!string.IsNullOrEmpty(authToken))
            {
                request.SetRequestHeader("Authorization", "Bearer " + authToken);
            }
            
            request.SetRequestHeader("Content-Type", "application/json");
            
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    T response = JsonUtility.FromJson<T>(request.downloadHandler.text);
                    callback?.Invoke(response, true);
                }
                catch (System.Exception e)
                {
                    Debug.LogError("JSON Parse Error: " + e.Message);
                    callback?.Invoke(default(T), false);
                }
            }
            else
            {
                Debug.LogError("API Error: " + request.error);
                callback?.Invoke(default(T), false);
            }
        }
    }
    
    // Public getters
    public User GetCurrentUser() => currentUser;
    public bool IsLoggedIn() => !string.IsNullOrEmpty(authToken) && currentUser != null;
    public string GetAuthToken() => authToken;
}