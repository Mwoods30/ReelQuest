using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class LeaderboardEntry
{
    public string _id;
    public int bestScore;
    public int totalGames;
    public int totalCatches;
    public int totalRareFish;
    public float averageScore;
    public PlayerInfo player;
}

[System.Serializable]
public class PlayerInfo
{
    public string username;
    public string name;
    public string avatar;
}

[System.Serializable]
public class LeaderboardResponse
{
    public string status;
    public LeaderboardEntry[] data;
}

public class LeaderboardManager : MonoBehaviour
{
    [Header("Leaderboard Settings")]
    public int maxEntries = 10;
    
    private LeaderboardEntry[] globalLeaderboard;
    private LeaderboardEntry[] currentGameModeLeaderboard;
    
    // Events
    public static event System.Action<LeaderboardEntry[]> OnGlobalLeaderboardUpdated;
    public static event System.Action<LeaderboardEntry[]> OnGameModeLeaderboardUpdated;
    public static event System.Action<int> OnUserRankUpdated;
    
    void Start()
    {
        // Subscribe to game events
        GameSessionManager.OnGameEnded += OnGameEnded;
        
        // Load initial leaderboard
        RefreshGlobalLeaderboard();
    }
    
    void OnDestroy()
    {
        GameSessionManager.OnGameEnded -= OnGameEnded;
    }
    
    private void OnGameEnded(GameEndRequest gameData)
    {
        // Refresh leaderboards after game ends
        StartCoroutine(DelayedLeaderboardRefresh());
    }
    
    private IEnumerator DelayedLeaderboardRefresh()
    {
        // Wait a moment for backend to process the game
        yield return new WaitForSeconds(1f);
        RefreshGlobalLeaderboard();
        GetUserRank();
    }
    
    public void RefreshGlobalLeaderboard()
    {
        StartCoroutine(GetGlobalLeaderboard());
    }
    
    public void RefreshGameModeLeaderboard(string gameMode)
    {
        StartCoroutine(GetGameModeLeaderboard(gameMode));
    }
    
    public void GetUserRank()
    {
        if (!ReelQuestAPI.Instance.IsLoggedIn())
            return;
            
        User currentUser = ReelQuestAPI.Instance.GetCurrentUser();
        if (currentUser != null)
        {
            StartCoroutine(GetUserRankRequest(currentUser._id));
        }
    }
    
    private IEnumerator GetGlobalLeaderboard()
    {
        string endpoint = "/leaderboard/global";
        string url = ReelQuestAPI.Instance.baseURL + endpoint;
        
        using (UnityEngine.Networking.UnityWebRequest webRequest = UnityEngine.Networking.UnityWebRequest.Get(url))
        {
            // Optional auth for leaderboard
            if (ReelQuestAPI.Instance.IsLoggedIn())
            {
                webRequest.SetRequestHeader("Authorization", "Bearer " + ReelQuestAPI.Instance.GetAuthToken());
            }
            
            webRequest.SetRequestHeader("Content-Type", "application/json");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                try
                {
                    LeaderboardResponse response = JsonUtility.FromJson<LeaderboardResponse>(webRequest.downloadHandler.text);
                    
                    if (response.status == "success")
                    {
                        globalLeaderboard = response.data;
                        OnGlobalLeaderboardUpdated?.Invoke(globalLeaderboard);
                        
                        Debug.Log($"Global leaderboard loaded: {globalLeaderboard.Length} entries");
                    }
                }
                catch (System.Exception e)
                {
                    Debug.LogError("Failed to parse global leaderboard: " + e.Message);
                }
            }
            else
            {
                Debug.LogError("Failed to get global leaderboard: " + webRequest.error);
            }
        }
    }
    
    private IEnumerator GetGameModeLeaderboard(string gameMode)
    {
        string endpoint = $"/leaderboard/gamemode/{gameMode}";
        string url = ReelQuestAPI.Instance.baseURL + endpoint;
        
        using (UnityEngine.Networking.UnityWebRequest webRequest = UnityEngine.Networking.UnityWebRequest.Get(url))
        {
            if (ReelQuestAPI.Instance.IsLoggedIn())
            {
                webRequest.SetRequestHeader("Authorization", "Bearer " + ReelQuestAPI.Instance.GetAuthToken());
            }
            
            webRequest.SetRequestHeader("Content-Type", "application/json");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                try
                {
                    LeaderboardResponse response = JsonUtility.FromJson<LeaderboardResponse>(webRequest.downloadHandler.text);
                    
                    if (response.status == "success")
                    {
                        currentGameModeLeaderboard = response.data;
                        OnGameModeLeaderboardUpdated?.Invoke(currentGameModeLeaderboard);
                        
                        Debug.Log($"Game mode '{gameMode}' leaderboard loaded: {currentGameModeLeaderboard.Length} entries");
                    }
                }
                catch (System.Exception e)
                {
                    Debug.LogError("Failed to parse game mode leaderboard: " + e.Message);
                }
            }
            else
            {
                Debug.LogError("Failed to get game mode leaderboard: " + webRequest.error);
            }
        }
    }
    
    private IEnumerator GetUserRankRequest(string userId)
    {
        string endpoint = $"/leaderboard/user/{userId}/rank";
        string url = ReelQuestAPI.Instance.baseURL + endpoint;
        
        using (UnityEngine.Networking.UnityWebRequest webRequest = UnityEngine.Networking.UnityWebRequest.Get(url))
        {
            webRequest.SetRequestHeader("Content-Type", "application/json");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                try
                {
                    // Parse rank response
                    var response = JsonUtility.FromJson<ApiResponse<RankData>>(webRequest.downloadHandler.text);
                    
                    if (response.status == "success")
                    {
                        OnUserRankUpdated?.Invoke(response.data.rank);
                        Debug.Log($"User rank: {response.data.rank}");
                    }
                }
                catch (System.Exception e)
                {
                    Debug.LogError("Failed to parse user rank: " + e.Message);
                }
            }
            else
            {
                Debug.LogError("Failed to get user rank: " + webRequest.error);
            }
        }
    }
    
    // Helper methods for UI
    public LeaderboardEntry[] GetGlobalLeaderboard() => globalLeaderboard;
    public LeaderboardEntry[] GetCurrentGameModeLeaderboard() => currentGameModeLeaderboard;
    
    public LeaderboardEntry FindUserInLeaderboard(string userId, LeaderboardEntry[] leaderboard)
    {
        if (leaderboard == null) return null;
        
        foreach (var entry in leaderboard)
        {
            if (entry._id == userId)
                return entry;
        }
        return null;
    }
    
    public int GetUserRankInLeaderboard(string userId, LeaderboardEntry[] leaderboard)
    {
        if (leaderboard == null) return -1;
        
        for (int i = 0; i < leaderboard.Length; i++)
        {
            if (leaderboard[i]._id == userId)
                return i + 1; // 1-based ranking
        }
        return -1;
    }
}

[System.Serializable]
public class RankData
{
    public int rank;
}