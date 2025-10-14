import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FishingGame from './FishingGame';

const Tab = createBottomTabNavigator();

function LeaderboardScreen() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      const savedScores = await AsyncStorage.getItem('scores');
      setScores(savedScores ? JSON.parse(savedScores) : []);
    } catch (error) {
      console.error('Error loading scores:', error);
    }
  };

  const addTestScore = async () => {
    const newScore = Math.floor(Math.random() * 1000) + 100;
    const updatedScores = [...scores, newScore].sort((a, b) => b - a).slice(0, 10);
    setScores(updatedScores);
    try {
      await AsyncStorage.setItem('scores', JSON.stringify(updatedScores));
      Alert.alert('Score Added!', `New score: ${newScore} points`);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.leaderboardContainer}>
          {scores.length > 0 ? (
            scores.map((score, index) => (
              <View key={index} style={styles.scoreItem}>
                <Text style={styles.scoreText}>{index + 1}. {score} pts</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noScoresText}>No scores yet. Start playing to see your results!</Text>
          )}
        </View>
        <TouchableOpacity style={styles.testButton} onPress={addTestScore}>
          <Text style={styles.testButtonText}>Add Test Score</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>About</Text>
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutText}>
            ReelQuest is a modern mobile fishing game. Cast your line, catch rare fish, and compete for the top score!
          </Text>
          <Text style={styles.aboutText}>
            Developed by: Matthew Woods, Ryan McKearnin, Tyler Klimczak, Willow Iloka
          </Text>
          <Text style={styles.aboutText}>
            Powered by Unity and React Native.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GameScreen() {
  const [gameMode, setGameMode] = useState('select'); // 'select', '3d', 'unity'
  const [totalScore, setTotalScore] = useState(0);

  const handleScoreUpdate = async (newScore) => {
    setTotalScore(prev => prev + newScore);
    // Save to leaderboard
    try {
      const savedScores = await AsyncStorage.getItem('scores');
      const scores = savedScores ? JSON.parse(savedScores) : [];
      const updatedScores = [...scores, totalScore + newScore].sort((a, b) => b - a).slice(0, 10);
      await AsyncStorage.setItem('scores', JSON.stringify(updatedScores));
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  if (gameMode === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.gameModeContainer}>
          <Text style={styles.title}>Choose Game Mode</Text>
          
          <TouchableOpacity 
            style={[styles.gameModeButton, styles.threeDButton]} 
            onPress={() => setGameMode('3d')}
          >
            <Text style={styles.gameModeButtonText}>🎣 3D Fishing Game</Text>
            <Text style={styles.gameModeDescription}>
              Cast your line, catch fish, and compete for high scores!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gameModeButton, styles.unityButton]} 
            onPress={() => setGameMode('unity')}
          >
            <Text style={styles.gameModeButtonText}>🎮 Unity WebGL</Text>
            <Text style={styles.gameModeDescription}>
              Play the original Unity fishing experience
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameMode === '3d') {
    return (
      <View style={styles.fullScreenGame}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setGameMode('select')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <FishingGame onScoreUpdate={handleScoreUpdate} />
      </View>
    );
  }

  // Unity WebGL mode
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <TouchableOpacity 
        style={styles.backButtonUnity}
        onPress={() => setGameMode('select')}
      >
        <Text style={styles.backButtonText}>← Back to Game Select</Text>
      </TouchableOpacity>
      <View style={styles.gameContainer}>
        <WebView
          source={{ uri: 'https://play.unity.com/en/games/8c7e7a3a-8cca-42dc-9833-7d80d3cea612/webgl-builds' }}
          style={styles.webview}
          onError={() => Alert.alert('Error', 'Failed to load game')}
          onLoadStart={() => console.log('Game loading...')}
          onLoadEnd={() => console.log('Game loaded')}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>🎮 Loading Unity Game...</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>ReelQuest Fishing</Text>
        <Text style={styles.welcomeText}>
          Welcome to ReelQuest, the most immersive fishing experience on mobile!{'\n'}
          Cast your line, catch rare fish, and climb the leaderboard.{'\n'}
          Powered by Unity and React Native.
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🎮 Play a realistic fishing game on your phone</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🏆 Compete for high scores on the leaderboard</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🐟 Discover and catch rare fish</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🧑‍💻 Built by passionate developers</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => navigation.navigate('Play')}
        >
          <Text style={styles.playButtonText}>Play Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#ff9800',
          tabBarInactiveTintColor: '#fff',
          tabBarLabelStyle: styles.tabLabel,
          headerShown: false,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{color, fontSize: 20}}>🏠</Text>
          }}
        />
        <Tab.Screen 
          name="Play" 
          component={GameScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{color, fontSize: 20}}>🎮</Text>
          }}
        />
        <Tab.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{color, fontSize: 20}}>🏆</Text>
          }}
        />
        <Tab.Screen 
          name="About" 
          component={AboutScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{color, fontSize: 20}}>ℹ️</Text>
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E67E22',
  },
  scrollContent: {
    padding: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 25,
    textShadowColor: 'rgba(241, 196, 15, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 28,
    fontWeight: '600',
    backgroundColor: 'rgba(236, 240, 241, 0.9)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#BDC3C7',
  },
  featuresContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    borderRadius: 25,
    padding: 25,
    marginBottom: 35,
    width: '100%',
    borderWidth: 3,
    borderColor: '#8BC34A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  featureItem: {
    marginBottom: 18,
  },
  featureText: {
    fontSize: 17,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '700',
    backgroundColor: 'rgba(241, 196, 15, 0.3)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1C40F',
  },
  playButton: {
    backgroundColor: '#8BC34A',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 25,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#689F38',
  },
  playButtonText: {
    color: '#2C3E50',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  leaderboardContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    borderRadius: 25,
    padding: 35,
    width: '100%',
    borderWidth: 3,
    borderColor: '#8BC34A',
    minHeight: 250,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  scoreItem: {
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(44, 62, 80, 0.3)',
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 15,
  },
  scoreText: {
    fontSize: 20,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '800',
  },
  noScoresText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(236, 240, 241, 0.8)',
    padding: 20,
    borderRadius: 15,
  },
  testButton: {
    backgroundColor: '#8BC34A',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 20,
    marginTop: 25,
    borderWidth: 2,
    borderColor: '#689F38',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testButtonText: {
    color: '#2C3E50',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  aboutContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    borderRadius: 25,
    padding: 35,
    width: '100%',
    borderWidth: 3,
    borderColor: '#8BC34A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  aboutText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
    fontWeight: '600',
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1C40F',
  },
  gameContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    backgroundColor: '#1a1a2e',
    borderTopColor: '#ff9800',
    borderTopWidth: 2,
    height: 80,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  gameModeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameModeButton: {
    width: '100%',
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  threeDButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderColor: '#ff9800',
  },
  unityButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  gameModeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  gameModeDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  fullScreenGame: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    zIndex: 100,
  },
  backButtonUnity: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});