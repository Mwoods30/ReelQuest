# 🎮 Unity WebGL Integration with ReelQuest Backend

This folder contains Unity C# scripts to integrate your Unity fishing game with the ReelQuest backend API.

## 📁 Files Overview

### Core Scripts
- **`ReelQuestAPI.cs`** - Main API communication class with authentication
- **`GameSessionManager.cs`** - Handles game sessions, scoring, and fish catches
- **`LeaderboardManager.cs`** - Manages leaderboards and user rankings
- **`UIManager.cs`** - Complete UI management for authentication and game interface

## 🔧 Setup Instructions

### 1. Unity Project Setup

1. **Copy Scripts**: Copy all `.cs` files to your Unity project's `Assets/Scripts/` folder

2. **Create GameObjects**: In your main scene, create empty GameObjects for:
   - `ReelQuestAPI` (attach `ReelQuestAPI.cs`)
   - `GameSessionManager` (attach `GameSessionManager.cs`)
   - `LeaderboardManager` (attach `LeaderboardManager.cs`)
   - `UIManager` (attach `UIManager.cs`)

3. **Configure API URL**: Set the `baseURL` in ReelQuestAPI to your backend URL:
   ```csharp
   public string baseURL = "http://localhost:5000/api";  // Development
   // public string baseURL = "https://your-backend.herokuapp.com/api";  // Production
   ```

### 2. UI Setup

The `UIManager.cs` script expects specific UI elements. Create these in your scene:

#### Authentication UI
- Login Panel with:
  - Email InputField (`loginEmail`)
  - Password InputField (`loginPassword`)
  - Login Button (`loginButton`)
  - "Show Signup" Button (`showSignupButton`)

- Signup Panel with:
  - Name InputField (`signupName`)
  - Username InputField (`signupUsername`)
  - Email InputField (`signupEmail`)
  - Password InputField (`signupPassword`)
  - Signup Button (`signupButton`)
  - "Show Login" Button (`showLoginButton`)

#### Game UI
- Score Text (`scoreText`)
- Catch Count Text (`catchCountText`)
- Welcome Text (`userWelcomeText`)
- Game Time Text (`gameTimeText`)
- Start Game Button (`startGameButton`)
- End Game Button (`endGameButton`)
- Logout Button (`logoutButton`)

#### Leaderboard UI
- Leaderboard Panel (`leaderboardPanel`)
- Content Transform (`leaderboardContent`)
- Entry Prefab (`leaderboardEntryPrefab`)
- Show/Hide Buttons (`showLeaderboardButton`, `hideLeaderboardButton`)
- User Rank Text (`userRankText`)

#### Notifications
- Notification Panel (`notificationPanel`)
- Notification Text (`notificationText`)

### 3. Backend Configuration

Update your backend's CORS settings in `backend/server.js` to include your Unity WebGL build domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',        // React app
    'http://localhost:3000',        // Alternative React port
    'https://your-game-domain.com', // Your Unity WebGL hosting
    'file://'                       // Local Unity testing
  ],
  credentials: true,
  // ... rest of config
};
```

## 🎮 Usage Examples

### Basic Authentication Flow
```csharp
void Start()
{
    // Login user
    ReelQuestAPI.Instance.Login("user@example.com", "password", (success) =>
    {
        if (success)
        {
            Debug.Log("User logged in successfully!");
            // Start your game logic
        }
    });
}
```

### Game Session Management
```csharp
void StartFishingGame()
{
    // Start a new game session
    gameSessionManager.StartGame();
}

void OnFishCaught(string fishType, string fishName, string rarity, int points, Vector2 location)
{
    // Record a fish catch
    gameSessionManager.CatchFish(fishType, fishName, rarity, points, location);
}

void OnGameComplete()
{
    // End the game session
    gameSessionManager.EndGame();
}
```

### Leaderboard Integration
```csharp
void ShowLeaderboard()
{
    // Refresh and display leaderboard
    leaderboardManager.RefreshGlobalLeaderboard();
}

// Subscribe to leaderboard updates
void OnEnable()
{
    LeaderboardManager.OnGlobalLeaderboardUpdated += UpdateLeaderboardUI;
}
```

## 🔗 API Events

The scripts use events for communication between components:

### ReelQuestAPI Events
- `OnUserLoggedIn(User user)` - Fired when user successfully logs in
- `OnUserLoggedOut()` - Fired when user logs out
- `OnApiError(string error)` - Fired when API errors occur

### GameSessionManager Events
- `OnGameStarted(GameSessionData data)` - Game session started
- `OnScoreUpdated(int score)` - Score changed
- `OnFishCaught(FishCatch fish)` - Fish was caught
- `OnGameEnded(GameEndRequest data)` - Game session ended

### LeaderboardManager Events
- `OnGlobalLeaderboardUpdated(LeaderboardEntry[] entries)` - Global leaderboard refreshed
- `OnUserRankUpdated(int rank)` - User's rank updated

## 🎣 Game Integration Examples

### Fishing Rod Controller
```csharp
public class FishingRodController : MonoBehaviour
{
    private GameSessionManager gameManager;
    
    void Start()
    {
        gameManager = FindObjectOfType<GameSessionManager>();
    }
    
    void OnFishCaught()
    {
        // Your fish catching logic here
        string fishType = "Bass";
        string fishName = "Largemouth Bass";
        string rarity = "common";
        int points = 100;
        Vector2 location = new Vector2(transform.position.x, transform.position.y);
        
        // Send to backend
        gameManager.CatchFish(fishType, fishName, rarity, points, location);
    }
    
    void OnPerfectCast()
    {
        gameManager.RecordPerfectCast();
    }
    
    void OnMissedCast()
    {
        gameManager.RecordMissedCast();
    }
}
```

### Game Manager Integration
```csharp
public class FishingGameManager : MonoBehaviour
{
    private GameSessionManager sessionManager;
    
    void Start()
    {
        sessionManager = FindObjectOfType<GameSessionManager>();
        
        // Subscribe to game events
        GameSessionManager.OnGameStarted += OnGameStarted;
        GameSessionManager.OnGameEnded += OnGameEnded;
    }
    
    private void OnGameStarted(GameSessionData sessionData)
    {
        Debug.Log($"Game started with difficulty: {sessionData.difficulty}");
        // Initialize your game state
    }
    
    private void OnGameEnded(GameEndRequest gameData)
    {
        Debug.Log($"Game ended with score: {gameData.score}");
        // Show game over screen, final stats, etc.
    }
}
```

## 🔧 Customization

### Fish Rarity System
Modify the fish rarity system in your game to match these backend categories:
- `"common"` - Regular fish (white color)
- `"uncommon"` - Slightly rare fish (green color)  
- `"rare"` - Rare fish (blue color)
- `"epic"` - Very rare fish (purple color)
- `"legendary"` - Extremely rare fish (gold color)

### Scoring System
The backend tracks these statistics automatically:
- Total score
- High score (best single game)
- Total catches
- Rare fish caught
- Games played
- Total play time

### Achievement System
The backend includes an achievement system that unlocks based on:
- First fish caught
- 100 total fish caught
- High score milestones
- Play time milestones
- Rare fish collection

## 🚀 WebGL Build Settings

For Unity WebGL builds:

1. **Platform Settings**: Switch to WebGL platform in Build Settings
2. **Player Settings**: 
   - Set "Run in Background" to true
   - Enable "Auto Graphics API" 
   - Set "Color Space" to Linear (recommended)
3. **Publishing Settings**:
   - Choose "Minimal" template for smaller build size
   - Enable "Compression Format" (Gzip or Brotli)

## 🐛 Troubleshooting

### CORS Issues
If you get CORS errors:
1. Make sure your backend CORS settings include your WebGL domain
2. For local testing, add `file://` to allowed origins
3. For production, add your actual domain

### Authentication Persistence
- Tokens are automatically saved to `PlayerPrefs`
- Users stay logged in between game sessions
- Tokens are validated on game startup

### Network Errors
- Check browser console for detailed error messages
- Verify backend is running and accessible
- Test API endpoints directly in browser

## 📚 Advanced Features

### Real-time Sync
You can extend this system to include:
- Real-time multiplayer fishing
- Live leaderboard updates
- Tournament modes
- Social features

### Analytics Integration
The system provides rich data for analytics:
- Player progression tracking
- Game balance metrics
- User engagement data
- Performance statistics

---

Your Unity fishing game is now ready to integrate with the ReelQuest backend! 🎣