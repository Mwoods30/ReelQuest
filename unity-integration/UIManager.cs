using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class UIManager : MonoBehaviour
{
    [Header("Authentication UI")]
    public GameObject loginPanel;
    public GameObject signupPanel;
    public GameObject gameUI;
    public TMP_InputField loginEmail;
    public TMP_InputField loginPassword;
    public TMP_InputField signupName;
    public TMP_InputField signupUsername;
    public TMP_InputField signupEmail;
    public TMP_InputField signupPassword;
    public Button loginButton;
    public Button signupButton;
    public Button logoutButton;
    public Button showSignupButton;
    public Button showLoginButton;
    
    [Header("Game UI")]
    public TextMeshProUGUI scoreText;
    public TextMeshProUGUI catchCountText;
    public TextMeshProUGUI userWelcomeText;
    public TextMeshProUGUI gameTimeText;
    public Button startGameButton;
    public Button endGameButton;
    
    [Header("Leaderboard UI")]
    public GameObject leaderboardPanel;
    public Transform leaderboardContent;
    public GameObject leaderboardEntryPrefab;
    public Button showLeaderboardButton;
    public Button hideLeaderboardButton;
    public TextMeshProUGUI userRankText;
    
    [Header("Notifications")]
    public GameObject notificationPanel;
    public TextMeshProUGUI notificationText;
    
    private GameSessionManager gameSessionManager;
    private LeaderboardManager leaderboardManager;
    
    void Start()
    {
        // Get managers
        gameSessionManager = FindObjectOfType<GameSessionManager>();
        leaderboardManager = FindObjectOfType<LeaderboardManager>();
        
        // Subscribe to events
        ReelQuestAPI.OnUserLoggedIn += OnUserLoggedIn;
        ReelQuestAPI.OnUserLoggedOut += OnUserLoggedOut;
        ReelQuestAPI.OnApiError += OnApiError;
        
        GameSessionManager.OnGameStarted += OnGameStarted;
        GameSessionManager.OnScoreUpdated += OnScoreUpdated;
        GameSessionManager.OnFishCaught += OnFishCaught;
        GameSessionManager.OnGameEnded += OnGameEnded;
        
        LeaderboardManager.OnGlobalLeaderboardUpdated += OnLeaderboardUpdated;
        LeaderboardManager.OnUserRankUpdated += OnUserRankUpdated;
        
        // Setup button events
        loginButton.onClick.AddListener(Login);
        signupButton.onClick.AddListener(SignUp);
        logoutButton.onClick.AddListener(Logout);
        showSignupButton.onClick.AddListener(() => ShowPanel(signupPanel));
        showLoginButton.onClick.AddListener(() => ShowPanel(loginPanel));
        
        startGameButton.onClick.AddListener(StartGame);
        endGameButton.onClick.AddListener(EndGame);
        
        showLeaderboardButton.onClick.AddListener(() => ShowPanel(leaderboardPanel));
        hideLeaderboardButton.onClick.AddListener(() => HidePanel(leaderboardPanel));
        
        // Initial UI state
        UpdateUIState();
        HideNotification();
    }
    
    void OnDestroy()
    {
        // Unsubscribe from events
        ReelQuestAPI.OnUserLoggedIn -= OnUserLoggedIn;
        ReelQuestAPI.OnUserLoggedOut -= OnUserLoggedOut;
        ReelQuestAPI.OnApiError -= OnApiError;
        
        GameSessionManager.OnGameStarted -= OnGameStarted;
        GameSessionManager.OnScoreUpdated -= OnScoreUpdated;
        GameSessionManager.OnFishCaught -= OnFishCaught;
        GameSessionManager.OnGameEnded -= OnGameEnded;
        
        LeaderboardManager.OnGlobalLeaderboardUpdated -= OnLeaderboardUpdated;
        LeaderboardManager.OnUserRankUpdated -= OnUserRankUpdated;
    }
    
    void Update()
    {
        // Update game time if game is in progress
        if (gameSessionManager != null && gameSessionManager.IsGameInProgress())
        {
            float gameTime = gameSessionManager.GetGameDuration();
            int minutes = Mathf.FloorToInt(gameTime / 60);
            int seconds = Mathf.FloorToInt(gameTime % 60);
            gameTimeText.text = $"Time: {minutes:00}:{seconds:00}";
        }
    }
    
    // Authentication Methods
    public void Login()
    {
        string email = loginEmail.text.Trim();
        string password = loginPassword.text;
        
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            ShowNotification("Please fill in all fields");
            return;
        }
        
        loginButton.interactable = false;
        ShowNotification("Logging in...");
        
        ReelQuestAPI.Instance.Login(email, password, (success) =>
        {
            loginButton.interactable = true;
            
            if (success)
            {
                HideNotification();
                ClearInputFields();
            }
            // Error will be shown by OnApiError event
        });
    }
    
    public void SignUp()
    {
        string name = signupName.text.Trim();
        string username = signupUsername.text.Trim();
        string email = signupEmail.text.Trim();
        string password = signupPassword.text;
        
        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(username) || 
            string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            ShowNotification("Please fill in all fields");
            return;
        }
        
        signupButton.interactable = false;
        ShowNotification("Creating account...");
        
        ReelQuestAPI.Instance.SignUp(name, username, email, password, (success) =>
        {
            signupButton.interactable = true;
            
            if (success)
            {
                HideNotification();
                ClearInputFields();
            }
            // Error will be shown by OnApiError event
        });
    }
    
    public void Logout()
    {
        ReelQuestAPI.Instance.Logout();
    }
    
    // Game Methods
    public void StartGame()
    {
        if (gameSessionManager != null)
        {
            gameSessionManager.StartGame();
        }
    }
    
    public void EndGame()
    {
        if (gameSessionManager != null)
        {
            gameSessionManager.EndGame();
        }
    }
    
    // Event Handlers
    private void OnUserLoggedIn(User user)
    {
        UpdateUIState();
        userWelcomeText.text = $"Welcome, {user.name}!";
        ShowNotification($"Welcome back, {user.username}!");
        
        // Hide notification after a delay
        Invoke(nameof(HideNotification), 2f);
    }
    
    private void OnUserLoggedOut()
    {
        UpdateUIState();
        userWelcomeText.text = "Not logged in";
        ClearInputFields();
    }
    
    private void OnApiError(string error)
    {
        ShowNotification($"Error: {error}");
    }
    
    private void OnGameStarted(GameSessionData sessionData)
    {
        UpdateUIState();
        ShowNotification("Game started! Good luck fishing!");
        Invoke(nameof(HideNotification), 2f);
    }
    
    private void OnScoreUpdated(int newScore)
    {
        scoreText.text = $"Score: {newScore:N0}";
    }
    
    private void OnFishCaught(FishCatch fishCatch)
    {
        if (gameSessionManager != null)
        {
            catchCountText.text = $"Catches: {gameSessionManager.GetTotalCatches()}";
        }
        
        // Show catch notification
        string rarityColor = GetRarityColor(fishCatch.rarity);
        ShowNotification($"<color={rarityColor}>Caught {fishCatch.name}! +{fishCatch.points} points</color>");
        Invoke(nameof(HideNotification), 2f);
    }
    
    private void OnGameEnded(GameEndRequest gameData)
    {
        UpdateUIState();
        ShowNotification($"Game finished! Final score: {gameData.score:N0}");
        
        // Refresh leaderboard
        if (leaderboardManager != null)
        {
            leaderboardManager.RefreshGlobalLeaderboard();
        }
    }
    
    private void OnLeaderboardUpdated(LeaderboardEntry[] leaderboard)
    {
        UpdateLeaderboardUI(leaderboard);
    }
    
    private void OnUserRankUpdated(int rank)
    {
        userRankText.text = $"Your Rank: #{rank}";
    }
    
    // UI Helper Methods
    private void UpdateUIState()
    {
        bool isLoggedIn = ReelQuestAPI.Instance != null && ReelQuestAPI.Instance.IsLoggedIn();
        bool gameInProgress = gameSessionManager != null && gameSessionManager.IsGameInProgress();
        
        // Show/hide panels
        loginPanel.SetActive(!isLoggedIn);
        signupPanel.SetActive(false);
        gameUI.SetActive(isLoggedIn);
        
        // Update game controls
        if (isLoggedIn)
        {
            startGameButton.interactable = !gameInProgress;
            endGameButton.interactable = gameInProgress;
            
            if (!gameInProgress)
            {
                gameTimeText.text = "Time: 00:00";
                scoreText.text = "Score: 0";
                catchCountText.text = "Catches: 0";
            }
        }
    }
    
    private void ShowPanel(GameObject panel)
    {
        panel.SetActive(true);
    }
    
    private void HidePanel(GameObject panel)
    {
        panel.SetActive(false);
    }
    
    private void ShowNotification(string message)
    {
        notificationText.text = message;
        notificationPanel.SetActive(true);
    }
    
    private void HideNotification()
    {
        notificationPanel.SetActive(false);
    }
    
    private void ClearInputFields()
    {
        loginEmail.text = "";
        loginPassword.text = "";
        signupName.text = "";
        signupUsername.text = "";
        signupEmail.text = "";
        signupPassword.text = "";
    }
    
    private void UpdateLeaderboardUI(LeaderboardEntry[] leaderboard)
    {
        // Clear existing entries
        foreach (Transform child in leaderboardContent)
        {
            Destroy(child.gameObject);
        }
        
        // Add new entries
        for (int i = 0; i < leaderboard.Length; i++)
        {
            GameObject entryObj = Instantiate(leaderboardEntryPrefab, leaderboardContent);
            LeaderboardEntryUI entryUI = entryObj.GetComponent<LeaderboardEntryUI>();
            
            if (entryUI != null)
            {
                entryUI.Setup(i + 1, leaderboard[i]);
            }
        }
    }
    
    private string GetRarityColor(string rarity)
    {
        switch (rarity.ToLower())
        {
            case "common": return "#FFFFFF";
            case "uncommon": return "#00FF00";
            case "rare": return "#0080FF";
            case "epic": return "#8000FF";
            case "legendary": return "#FFD700";
            default: return "#FFFFFF";
        }
    }
}

// Helper component for leaderboard entries
public class LeaderboardEntryUI : MonoBehaviour
{
    public TextMeshProUGUI rankText;
    public TextMeshProUGUI nameText;
    public TextMeshProUGUI scoreText;
    public TextMeshProUGUI catchesText;
    public Image backgroundImage;
    
    public void Setup(int rank, LeaderboardEntry entry)
    {
        rankText.text = $"#{rank}";
        nameText.text = entry.player.username;
        scoreText.text = entry.bestScore.ToString("N0");
        catchesText.text = entry.totalCatches.ToString();
        
        // Highlight current user
        if (ReelQuestAPI.Instance.IsLoggedIn())
        {
            User currentUser = ReelQuestAPI.Instance.GetCurrentUser();
            if (currentUser != null && currentUser._id == entry._id)
            {
                backgroundImage.color = new Color(1f, 0.8f, 0.2f, 0.3f); // Gold tint
            }
        }
    }
}