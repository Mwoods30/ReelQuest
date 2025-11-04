using System;
using System.Collections;
using UnityEngine;

[System.Serializable]
public class GameStartRequest
{
    public string difficulty = "medium";
    public string gameMode = "classic";
}

[System.Serializable]
public class GameStartResponse
{
    public string status;
    public GameSessionData data;
}

[System.Serializable]
public class GameSessionData
{
    public string sessionId;
    public DateTime startTime;
    public string difficulty;
    public string gameMode;
}

[System.Serializable]
public class FishCatch
{
    public string type;
    public string name;
    public string rarity;
    public int points;
    public Vector2 location;
}

[System.Serializable]
public class CatchRequest
{
    public string type;
    public string name;
    public string rarity;
    public int points;
    public LocationData location;
}

[System.Serializable]
public class LocationData
{
    public float x;
    public float y;
}

[System.Serializable]
public class GameEndRequest
{
    public int score;
    public int totalCatches;
    public int rareFishCaught;
    public int perfectCasts;
    public int missedCasts;
    public int playTime; // in seconds
}

public class GameSessionManager : MonoBehaviour
{
    [Header("Game Session Settings")]
    public string difficulty = "medium";
    public string gameMode = "classic";
    
    private string currentSessionId;
    private DateTime gameStartTime;
    private int currentScore;
    private int totalCatches;
    private int rareFishCaught;
    private int perfectCasts;
    private int missedCasts;
    private bool gameInProgress;
    
    // Events
    public static event System.Action<GameSessionData> OnGameStarted;
    public static event System.Action<int> OnScoreUpdated;
    public static event System.Action<FishCatch> OnFishCaught;
    public static event System.Action<GameEndRequest> OnGameEnded;
    
    void Start()
    {
        // Subscribe to API events
        ReelQuestAPI.OnUserLoggedIn += OnUserLoggedIn;
        ReelQuestAPI.OnUserLoggedOut += OnUserLoggedOut;
    }
    
    void OnDestroy()
    {
        // Unsubscribe from events
        ReelQuestAPI.OnUserLoggedIn -= OnUserLoggedIn;
        ReelQuestAPI.OnUserLoggedOut -= OnUserLoggedOut;
        
        // End game if in progress
        if (gameInProgress)
        {
            EndGame();
        }
    }
    
    private void OnUserLoggedIn(User user)
    {
        Debug.Log($"User logged in: {user.username}");
    }
    
    private void OnUserLoggedOut()
    {
        Debug.Log("User logged out");
        if (gameInProgress)
        {
            EndGame();
        }
    }
    
    public void StartGame()
    {
        if (!ReelQuestAPI.Instance.IsLoggedIn())
        {
            Debug.LogError("Cannot start game: User not logged in");
            return;
        }
        
        if (gameInProgress)
        {
            Debug.LogWarning("Game already in progress");
            return;
        }
        
        var request = new GameStartRequest
        {
            difficulty = this.difficulty,
            gameMode = this.gameMode
        };
        
        StartCoroutine(StartGameRequest(request));
    }
    
    private IEnumerator StartGameRequest(GameStartRequest request)
    {
        string endpoint = "/games/start";
        string url = ReelQuestAPI.Instance.baseURL + endpoint;
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityEngine.Networking.UnityWebRequest webRequest = new UnityEngine.Networking.UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            webRequest.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(bodyRaw);
            webRequest.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
            
            webRequest.SetRequestHeader("Authorization", "Bearer " + ReelQuestAPI.Instance.GetAuthToken());
            webRequest.SetRequestHeader("Content-Type", "application/json");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                try
                {
                    GameStartResponse response = JsonUtility.FromJson<GameStartResponse>(webRequest.downloadHandler.text);
                    
                    if (response.status == "success")
                    {
                        currentSessionId = response.data.sessionId;
                        gameStartTime = DateTime.Now;
                        gameInProgress = true;
                        
                        // Reset game stats
                        currentScore = 0;
                        totalCatches = 0;
                        rareFishCaught = 0;
                        perfectCasts = 0;
                        missedCasts = 0;
                        
                        OnGameStarted?.Invoke(response.data);
                        Debug.Log($"Game started with session ID: {currentSessionId}");
                    }
                    else
                    {
                        Debug.LogError("Failed to start game: " + response.status);
                    }
                }
                catch (System.Exception e)
                {
                    Debug.LogError("Failed to parse game start response: " + e.Message);
                }
            }
            else
            {
                Debug.LogError("Failed to start game: " + webRequest.error);
            }
        }
    }
    
    public void CatchFish(string fishType, string fishName, string rarity, int points, Vector2 location)
    {
        if (!gameInProgress)
        {
            Debug.LogWarning("Cannot catch fish: No game in progress");
            return;
        }
        
        var catchData = new FishCatch
        {
            type = fishType,
            name = fishName,
            rarity = rarity,
            points = points,
            location = location
        };
        
        // Update local stats
        currentScore += points;
        totalCatches++;
        
        if (rarity == "rare" || rarity == "epic" || rarity == "legendary")
        {
            rareFishCaught++;
        }
        
        OnFishCaught?.Invoke(catchData);
        OnScoreUpdated?.Invoke(currentScore);
        
        // Send to backend
        StartCoroutine(SendCatchToBackend(catchData));
        
        Debug.Log($"Caught {fishName} ({rarity}) for {points} points!");
    }
    
    private IEnumerator SendCatchToBackend(FishCatch catchData)
    {
        var request = new CatchRequest
        {
            type = catchData.type,
            name = catchData.name,
            rarity = catchData.rarity,
            points = catchData.points,
            location = new LocationData { x = catchData.location.x, y = catchData.location.y }
        };
        
        string endpoint = $"/games/{currentSessionId}/catch";
        string url = ReelQuestAPI.Instance.baseURL + endpoint;
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityEngine.Networking.UnityWebRequest webRequest = new UnityEngine.Networking.UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            webRequest.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(bodyRaw);
            webRequest.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
            
            webRequest.SetRequestHeader("Authorization", "Bearer " + ReelQuestAPI.Instance.GetAuthToken());
            webRequest.SetRequestHeader("Content-Type", "application/json");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result != UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                Debug.LogError("Failed to send catch to backend: " + webRequest.error);
            }
        }
    }
    
    public void RecordPerfectCast()
    {
        perfectCasts++;
    }
    
    public void RecordMissedCast()
    {
        missedCasts++;
    }
    
    public void EndGame()
    {
        if (!gameInProgress)
        {
            Debug.LogWarning("No game in progress to end");
            return;
        }
        
        int playTimeSeconds = (int)(DateTime.Now - gameStartTime).TotalSeconds;
        
        var gameEndData = new GameEndRequest
        {
            score = currentScore,
            totalCatches = totalCatches,
            rareFishCaught = rareFishCaught,
            perfectCasts = perfectCasts,
            missedCasts = missedCasts,
            playTime = playTimeSeconds
        };
        
        StartCoroutine(EndGameRequest(gameEndData));
        
        gameInProgress = false;
        OnGameEnded?.Invoke(gameEndData);
        
        Debug.Log($"Game ended - Score: {currentScore}, Catches: {totalCatches}, Time: {playTimeSeconds}s");
    }
    
    private IEnumerator EndGameRequest(GameEndRequest gameData)
    {
        string endpoint = $"/games/{currentSessionId}/end";
        string url = ReelQuestAPI.Instance.baseURL + endpoint;
        string jsonData = JsonUtility.ToJson(gameData);
        
        using (UnityEngine.Networking.UnityWebRequest webRequest = new UnityEngine.Networking.UnityWebRequest(url, "PATCH"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            webRequest.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(bodyRaw);
            webRequest.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
            
            webRequest.SetRequestHeader("Authorization", "Bearer " + ReelQuestAPI.Instance.GetAuthToken());
            webRequest.SetRequestHeader("Content-Type", "application/json");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                Debug.Log("Game ended successfully on backend");
                
                // Refresh user profile to get updated stats
                ReelQuestAPI.Instance.GetUserProfile((user) =>
                {
                    if (user != null)
                    {
                        Debug.Log($"Updated user stats - High Score: {user.gameStats.highScore}, Total Games: {user.gameStats.gamesPlayed}");
                    }
                });
            }
            else
            {
                Debug.LogError("Failed to end game on backend: " + webRequest.error);
            }
        }
    }
    
    // Public getters for UI
    public int GetCurrentScore() => currentScore;
    public int GetTotalCatches() => totalCatches;
    public int GetRareFishCaught() => rareFishCaught;
    public bool IsGameInProgress() => gameInProgress;
    public string GetCurrentSessionId() => currentSessionId;
    public float GetGameDuration() => gameInProgress ? (float)(DateTime.Now - gameStartTime).TotalSeconds : 0f;
}