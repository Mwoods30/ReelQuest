import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  BackHandler
} from 'react-native';
import { Svg, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Rod types with different stats
const rodTypes = [
  {
    id: 'basic',
    name: 'Basic Rod',
    price: 0,
    biteBonus: 0,
    strengthBonus: 0,
    description: 'A simple fishing rod',
    color: '#8D6E63'
  },
  {
    id: 'carbon',
    name: 'Carbon Fiber Rod',
    price: 100,
    biteBonus: 0.1,
    strengthBonus: 0.15,
    description: 'Lightweight and sensitive',
    color: '#424242'
  },
  {
    id: 'pro',
    name: 'Pro Tournament Rod',
    price: 300,
    biteBonus: 0.2,
    strengthBonus: 0.3,
    description: 'Professional grade equipment',
    color: '#1565C0'
  },
  {
    id: 'master',
    name: 'Master Angler Rod',
    price: 750,
    biteBonus: 0.35,
    strengthBonus: 0.5,
    description: 'The ultimate fishing experience',
    color: '#FFD700'
  }
];

// Scenery locations
const locations = [
  {
    id: 'lake',
    name: 'Peaceful Lake',
    price: 0,
    skyGradient: ['#87CEEB', '#B0E0E6', '#4FC3F7'],
    waterGradient: ['#4FC3F7', '#1976D2', '#0D47A1'],
    unlocked: true
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    price: 200,
    skyGradient: ['#FF7043', '#FF8A65', '#FFAB91'],
    waterGradient: ['#006064', '#00838F', '#0097A7'],
    unlocked: false
  },
  {
    id: 'river',
    name: 'Mountain River',
    price: 500,
    skyGradient: ['#81C784', '#A5D6A7', '#C8E6C9'],
    waterGradient: ['#388E3C', '#4CAF50', '#66BB6A'],
    unlocked: false
  }
];

// Bait types
const baitTypes = [
  {
    id: 'worm',
    name: 'Earthworms',
    price: 0,
    biteBonus: 0,
    description: 'Basic fishing bait'
  },
  {
    id: 'lure',
    name: 'Spinner Lure',
    price: 25,
    biteBonus: 0.15,
    description: 'Attracts more fish'
  },
  {
    id: 'premium',
    name: 'Premium Flies',
    price: 75,
    biteBonus: 0.3,
    description: 'Irresistible to rare fish'
  }
];

const fishTypes = [
  { 
    name: 'Bluegill', 
    color: '#4FC3F7', 
    points: 5, 
    speed: 1.5, 
    size: 20, 
    rarity: 0.4, 
    biteChance: 0.95, 
    fightDuration: 8000,
    difficultyZones: 2
  },
  { 
    name: 'Bass', 
    color: '#8BC34A', 
    points: 15, 
    speed: 2.5, 
    size: 35, 
    rarity: 0.3, 
    biteChance: 0.8, 
    fightDuration: 10000,
    difficultyZones: 3
  },
  { 
    name: 'Trout', 
    color: '#FF9800', 
    points: 25, 
    speed: 3.5, 
    size: 30, 
    rarity: 0.2, 
    biteChance: 0.7, 
    fightDuration: 12000,
    difficultyZones: 4
  },
  { 
    name: 'Pike', 
    color: '#4CAF50', 
    points: 35, 
    speed: 4, 
    size: 50, 
    rarity: 0.08, 
    biteChance: 0.6, 
    fightDuration: 14000,
    difficultyZones: 5
  },
  { 
    name: 'Salmon', 
    color: '#E91E63', 
    points: 50, 
    speed: 5, 
    size: 45, 
    rarity: 0.02, 
    biteChance: 0.5, 
    fightDuration: 16000,
    difficultyZones: 6
  }
];

const FishingGame = ({ onScoreUpdate }) => {
  const [gameState, setGameState] = useState('waiting');
  const [fish, setFish] = useState([]);
  const [score, setScore] = useState(0);
  const [bobberPos, setBobberPos] = useState({ x: width / 2, y: height * 0.35 });
  const [gameEnded, setGameEnded] = useState(false);
  const [biteIndicator, setBiteIndicator] = useState(false);
  const [reelChallenge, setReelChallenge] = useState(null);
  const [currentFish, setCurrentFish] = useState(null);
  const [reelProgress, setReelProgress] = useState(0);
  const [challengeZones, setChallengeZones] = useState([]);
  const [playerTiming, setPlayerTiming] = useState(null);

  // Shop and progression state
  const [coins, setCoins] = useState(0);
  const [currentRod, setCurrentRod] = useState(rodTypes[0]);
  const [currentLocation, setCurrentLocation] = useState(locations[0]);
  const [currentBait, setCurrentBait] = useState(baitTypes[0]);
  const [showShop, setShowShop] = useState(false);
  const [ownedRods, setOwnedRods] = useState(['basic']);
  const [ownedBait, setOwnedBait] = useState(['worm']);
  const [unlockedLocations, setUnlockedLocations] = useState(['lake']);

  const bobberAnim = useRef(new Animated.ValueXY({ x: width / 2, y: height * 0.35 })).current;
  const waterAnim = useRef(new Animated.Value(0)).current;
  const boatRockAnim = useRef(new Animated.Value(0)).current;
  const characterAnim = useRef(new Animated.Value(0)).current;

  // Load saved progress
  const loadProgress = async () => {
    try {
      const savedData = await AsyncStorage.getItem('fishingGameProgress');
      if (savedData) {
        const progress = JSON.parse(savedData);
        setCoins(progress.coins || 0);
        setOwnedRods(progress.ownedRods || ['basic']);
        setOwnedBait(progress.ownedBait || ['worm']);
        setUnlockedLocations(progress.unlockedLocations || ['lake']);
        
        // Set current equipment
        const savedRod = rodTypes.find(rod => rod.id === progress.currentRod) || rodTypes[0];
        const savedLocation = locations.find(loc => loc.id === progress.currentLocation) || locations[0];
        const savedBait = baitTypes.find(bait => bait.id === progress.currentBait) || baitTypes[0];
        
        setCurrentRod(savedRod);
        setCurrentLocation(savedLocation);
        setCurrentBait(savedBait);
      }
    } catch (error) {
      console.log('Error loading progress:', error);
    }
  };

  // Save progress
  const saveProgress = async () => {
    try {
      const progress = {
        coins,
        ownedRods,
        ownedBait,
        unlockedLocations,
        currentRod: currentRod.id,
        currentLocation: currentLocation.id,
        currentBait: currentBait.id
      };
      await AsyncStorage.setItem('fishingGameProgress', JSON.stringify(progress));
    } catch (error) {
      console.log('Error saving progress:', error);
    }
  };

  const generateFish = () =>
    Array.from({ length: 8 }, (_, i) => {
      // Use rarity system for fish selection
      const randomValue = Math.random();
      let cumulativeRarity = 0;
      let selectedType = fishTypes[0];
      
      for (const fishType of fishTypes) {
        cumulativeRarity += fishType.rarity;
        if (randomValue <= cumulativeRarity) {
          selectedType = fishType;
          break;
        }
      }
      
      return {
        id: i + Date.now(),
        type: selectedType,
        x: Math.random() * width * 0.8 + width * 0.1,
        y: height * 0.45 + Math.random() * (height * 0.25),
        dir: Math.random() > 0.5 ? 1 : -1,
        baseY: height * 0.45 + Math.random() * (height * 0.25),
        phase: Math.random() * Math.PI * 2,
        approachingBait: false,
        distanceToBait: Infinity
      };
    });

  // Initialize
  useEffect(() => {
    loadProgress();
    setFish(generateFish());
    const waterLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waterAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(waterAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    waterLoop.start();
    
    // Subtle boat rocking animation
    const boatRockLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(boatRockAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(boatRockAnim, { toValue: -1, duration: 4000, useNativeDriver: true }),
      ])
    );
    boatRockLoop.start();
    
    // Character breathing animation
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(characterAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(characterAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    breathingLoop.start();
    return () => {
      waterLoop.stop();
    };
  }, []);



  // Reel challenge mechanics
  useEffect(() => {
    if (!reelChallenge || !reelChallenge.active) return;
    
    const challengeTimer = setInterval(() => {
      setReelChallenge(prev => {
        if (!prev) return null;
        
        const newTimer = prev.timer - 150;
        
        // Check win condition
        const allZonesHit = challengeZones.every(zone => zone.hit);
        if (allZonesHit && reelProgress >= 85) {
          setTimeout(() => reelIn(prev.fishData), 100);
          return { ...prev, active: false };
        }
        
        // Check lose condition
        if (newTimer <= 0) {
          setTimeout(() => fishEscapes(), 100);
          return { ...prev, active: false };
        }
        
        return { ...prev, timer: newTimer };
      });
      
      // Auto-advance reel progress
      setReelProgress(prev => {
        const newProgress = prev + reelChallenge.speed;
        if (newProgress >= 100) {
          return 0; // Reset to start
        }
        return newProgress;
      });
      
    }, 150);
    
    return () => clearInterval(challengeTimer);
  }, [reelChallenge, challengeZones, reelProgress]);

  // Enhanced fish movement and bait detection
  useEffect(() => {
    const mover = setInterval(() => {
      if (gameEnded) return;
      
      setFish(prev =>
        prev.map(f => {
          let newX = f.x;
          let newY = f.y;
          let newApproaching = f.approachingBait;
          
          // Calculate distance to bobber
          const distanceToBait = Math.hypot(f.x - bobberPos.x, f.y - bobberPos.y);
          
          // Fish behavior based on game state and distance to bait
          if (gameState === 'fishing' && distanceToBait < 150 && Math.random() < 0.08) {
            // Fish notices the bait
            newApproaching = true;
          }
          
          if (newApproaching && gameState === 'fishing') {
            // Move towards bait
            const angleTooBait = Math.atan2(bobberPos.y - f.y, bobberPos.x - f.x);
            newX += Math.cos(angleTooBait) * f.type.speed * 0.8;
            newY += Math.sin(angleTooBait) * f.type.speed * 0.8;
            
            // Add some randomness to movement
            newX += (Math.random() - 0.5) * 2;
            newY += (Math.random() - 0.5) * 2;
          } else {
            // Normal swimming behavior
            newX += f.dir * f.type.speed;
            newY = f.baseY + Math.sin(Date.now() / 800 + f.phase) * 15;
            
            // Boundary checking and direction change
            if (newX < 0 || newX > width) {
              f.dir *= -1;
              newX = Math.max(20, Math.min(width - 20, newX));
            }
          }
          
          return { 
            ...f, 
            x: newX, 
            y: newY, 
            approachingBait: newApproaching,
            distanceToBait: distanceToBait
          };
        })
      );
    }, 100);
    return () => clearInterval(mover);
  }, [gameState, bobberPos, gameEnded]);

  // Disable back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Return true to prevent default behavior (going back)
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const castLine = () => {
    if (gameState !== 'waiting' || gameEnded) return;
    setGameState('casting');
    const targetX = Math.random() * width * 0.7 + width * 0.15;
    const targetY = height * 0.35 + Math.random() * height * 0.35;

    Animated.timing(bobberAnim, {
      toValue: { x: targetX, y: targetY },
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      setBobberPos({ x: targetX, y: targetY });
      setGameState('fishing');
      checkForBite(targetX, targetY);
    });
  };

  const checkForBite = (x, y) => {
    setBobberPos({ x, y });
    
    // Wait a bit for fish to notice the bait
    setTimeout(() => {
      const nearbyFish = fish.filter(f => f.distanceToBait < 100);
      
      if (nearbyFish.length > 0) {
        // Select the closest fish with highest bite chance
        const biter = nearbyFish.reduce((best, current) => {
          const currentChance = current.type.biteChance * (1 - current.distanceToBait / 100);
          const bestChance = best ? best.type.biteChance * (1 - best.distanceToBait / 100) : 0;
          return currentChance > bestChance ? current : best;
        });
        
        // Random bite check based on fish type + equipment bonuses
        const totalBiteChance = biter.type.biteChance + currentRod.biteBonus + currentBait.biteBonus;
        if (Math.random() < totalBiteChance) {
          // Fish bites!
          setBiteIndicator(true);
          setCurrentFish(biter);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Remove the fish from the pool and start reel challenge
          setFish(prev => prev.filter(f => f.id !== biter.id));
          
          // Start the skill challenge after a brief delay
          setTimeout(() => {
            setBiteIndicator(false);
            startReelChallenge(biter);
          }, 1000);
          
          return;
        }
      }
      
      // No bite - try again or reset
      setTimeout(() => {
        if (Math.random() < 0.3) {
          checkForBite(x, y); // Try again
        } else {
          resetBobber(); // Give up
        }
      }, 2000);
      
    }, 1500 + Math.random() * 2000); // Variable wait time
  };

  const startReelChallenge = (fishData) => {
    setGameState('reeling');
    setCurrentFish(fishData);
    setReelProgress(0);
    
    // Generate challenge zones based on fish difficulty and rod strength
    const zones = [];
    const baseDifficulty = fishData.type.difficultyZones;
    const rodBonus = currentRod.strengthBonus;
    const adjustedDifficulty = Math.max(1, baseDifficulty - Math.floor(rodBonus * 3));
    
    for (let i = 0; i < adjustedDifficulty; i++) {
      const zoneStart = Math.random() * 60 + 20; // 20-80% range
      const baseWidth = 35 - (adjustedDifficulty * 1.5);
      const rodWidthBonus = rodBonus * 15; // Rod makes zones bigger
      const zoneWidth = Math.max(25, baseWidth + rodWidthBonus);
      
      zones.push({
        start: zoneStart,
        end: Math.min(90, zoneStart + zoneWidth),
        hit: false
      });
    }
    
    setChallengeZones(zones);
    
    // Rod affects fight duration and speed
    const adjustedDuration = fishData.type.fightDuration * (1 + rodBonus);
    const adjustedSpeed = Math.max(0.15, 0.4 + (adjustedDifficulty * 0.05) - (rodBonus * 0.2));
    
    setReelChallenge({
      active: true,
      timer: adjustedDuration,
      speed: adjustedSpeed,
      fishData
    });
  };

  const handleReelTap = () => {
    if (!reelChallenge || !reelChallenge.active) return;
    
    const currentPosition = reelProgress;
    let hitZone = false;
    
    // Check if we hit any unhit zones
    const updatedZones = challengeZones.map(zone => {
      if (!zone.hit && currentPosition >= zone.start && currentPosition <= zone.end) {
        hitZone = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return { ...zone, hit: true };
      }
      return zone;
    });
    
    setChallengeZones(updatedZones);
    
    if (hitZone) {
      setReelProgress(prev => Math.min(100, prev + 15));
    } else {
      // Missed - fish struggles more
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setReelProgress(prev => Math.max(0, prev - 8));
    }
  };

  const reelIn = (fishData) => {
    setGameState('waiting');
    setReelChallenge(null);
    setCurrentFish(null);
    setChallengeZones([]);
    setReelProgress(0);
    
    const points = fishData.type.points;
    const coinReward = Math.ceil(points / 2); // Convert points to coins
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScore(s => s + points);
    setCoins(c => c + coinReward);
    
    Alert.alert('🎣 Caught!', `You caught a ${fishData.type.name}!\n+${points} points\n+${coinReward} coins`);
    saveProgress();
    resetBobber();
  };

  // Shop functions
  const buyItem = async (item, type) => {
    if (coins >= item.price) {
      setCoins(c => c - item.price);
      
      if (type === 'rod') {
        setOwnedRods(prev => [...prev, item.id]);
        setCurrentRod(item);
      } else if (type === 'bait') {
        setOwnedBait(prev => [...prev, item.id]);
        setCurrentBait(item);
      } else if (type === 'location') {
        setUnlockedLocations(prev => [...prev, item.id]);
        setCurrentLocation(item);
      }
      
      await saveProgress();
      Alert.alert('✅ Purchased!', `You bought ${item.name}!`);
    } else {
      Alert.alert('💰 Not enough coins!', `You need ${item.price - coins} more coins.`);
    }
  };

  const equipItem = (item, type) => {
    if (type === 'rod') setCurrentRod(item);
    else if (type === 'bait') setCurrentBait(item);
    else if (type === 'location') setCurrentLocation(item);
    saveProgress();
  };

  const fishEscapes = () => {
    setGameState('waiting');
    setReelChallenge(null);
    setCurrentFish(null);
    setChallengeZones([]);
    setReelProgress(0);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('💥 Fish Escaped!', `The ${currentFish?.type.name} got away!`);
    resetBobber();
  };

  const resetBobber = () => {
    Animated.timing(bobberAnim, {
      toValue: { x: width / 2, y: 120 },
      duration: 700,
      useNativeDriver: false,
    }).start(() => setGameState('waiting'));
  };

  const waterTranslate = waterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });
  
  // Character animation transforms
  const breathingScale = characterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });
  
  const rodAngle = gameState === 'casting' ? -15 : (gameState === 'reeling' ? 10 : 0);
  const armPosition = gameState === 'casting' ? 5 : (gameState === 'reeling' ? -3 : 0);

  return (
    <View style={styles.container}>
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={currentLocation.skyGradient[0]} />
            <Stop offset="60%" stopColor={currentLocation.skyGradient[1]} />
            <Stop offset="100%" stopColor={currentLocation.skyGradient[2]} />
          </LinearGradient>
          <LinearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={currentLocation.waterGradient[0]} />
            <Stop offset="50%" stopColor={currentLocation.waterGradient[1]} />
            <Stop offset="100%" stopColor={currentLocation.waterGradient[2]} />
          </LinearGradient>
          <LinearGradient id="boatDeck" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#A1887F" />
            <Stop offset="30%" stopColor="#8D6E63" />
            <Stop offset="70%" stopColor="#6D4C41" />
            <Stop offset="100%" stopColor="#4E342E" />
          </LinearGradient>
        </Defs>
        
        {/* Sky background */}
        <Path d={`M0,0 L${width},0 L${width},${height * 0.25} L0,${height * 0.25}Z`} fill="url(#skyGradient)" />
        
        {/* Water background */}
        <Path d={`M0,${height * 0.25} L${width},${height * 0.25} L${width},${height * 0.85} L0,${height * 0.85}Z`} fill="url(#waterGradient)" />
        {/* Horizon line */}
        <Path
          d={`M0,${height * 0.25} L${width},${height * 0.25}`}
          stroke="#E0E0E0"
          strokeWidth="1"
          opacity="0.7"
        />
        
        {/* Water surface waves */}
        <Path
          d={`M0,${height * 0.28} Q${width / 4},${height * 0.26} ${width / 2},${height * 0.28} Q${width * 0.75},${height * 0.30} ${width},${height * 0.28} L${width},${height * 0.85} L0,${height * 0.85}Z`}
          fill="#1976D2"
          opacity="0.8"
        />
        
        {/* Animated water ripples */}
        <Path
          d={`M0,${height * 0.32} Q${width / 3},${height * 0.30} ${width * 0.6},${height * 0.32} Q${width * 0.8},${height * 0.34} ${width},${height * 0.32}`}
          stroke="#42A5F5"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <Path
          d={`M0,${height * 0.38} Q${width / 4},${height * 0.36} ${width / 2},${height * 0.38} Q${width * 0.75},${height * 0.40} ${width},${height * 0.38}`}
          stroke="#64B5F6"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        {fish.map(f => (
          <Circle 
            key={f.id} 
            cx={f.x} 
            cy={f.y} 
            r={f.type.size / 2} 
            fill={f.approachingBait ? '#FFD700' : f.type.color}
            stroke={f.approachingBait ? '#FF6B35' : 'none'}
            strokeWidth={f.approachingBait ? 2 : 0}
          />
        ))}
        {/* Angler Character */}
        {/* Head */}
        <Circle cx={width / 2 - 25} cy={height * 0.62} r="14" fill="#FFDBCB" stroke="#D7CCC8" strokeWidth="1" />
        
        {/* Eyes */}
        <Circle cx={width / 2 - 29} cy={height * 0.61} r="2" fill="#2C3E50" />
        <Circle cx={width / 2 - 21} cy={height * 0.61} r="2" fill="#2C3E50" />
        
        {/* Nose */}
        <Path
          d={`M${width / 2 - 25},${height * 0.625} L${width / 2 - 23.5},${height * 0.63} L${width / 2 - 26.5},${height * 0.63}Z`}
          fill="#E8A78F"
        />
        
        {/* Fishing hat */}
        <Path
          d={`M${width / 2 - 37},${height * 0.62} Q${width / 2 - 25},${height * 0.59} ${width / 2 - 13},${height * 0.62}`}
          fill="#4CAF50"
          stroke="#388E3C"
          strokeWidth="1"
        />
        <Path
          d={`M${width / 2 - 40},${height * 0.63} L${width / 2 - 10},${height * 0.63}`}
          stroke="#2E7D32"
          strokeWidth="2"
        />
        
        {/* Body/Torso */}
        <Path
          d={`M${width / 2 - 25},${height * 0.64} L${width / 2 - 25},${height * 0.80}`}
          stroke="#1976D2"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Fishing vest */}
        <Path
          d={`M${width / 2 - 34},${height * 0.67} L${width / 2 - 16},${height * 0.67} L${width / 2 - 16},${height * 0.76} L${width / 2 - 34},${height * 0.76}Z`}
          fill="#FF8F00"
          stroke="#F57F17"
          strokeWidth="1"
        />
        
        {/* Vest pockets */}
        <Path
          d={`M${width / 2 - 32},${height * 0.69} L${width / 2 - 28},${height * 0.69} L${width / 2 - 28},${height * 0.73} L${width / 2 - 32},${height * 0.73}Z`}
          fill="#E65100"
        />
        <Path
          d={`M${width / 2 - 22},${height * 0.69} L${width / 2 - 18},${height * 0.69} L${width / 2 - 18},${height * 0.73} L${width / 2 - 22},${height * 0.73}Z`}
          fill="#E65100"
        />
        
        {/* Left arm (holding rod handle) */}
        <Path
          d={`M${width / 2 - 35},${height * 0.69} L${width / 2 - 30},${height * 0.78}`}
          stroke="#FFDBCB"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* Right arm (holding rod mid-section) */}
        <Path
          d={`M${width / 2 - 15},${height * 0.69} L${width / 2 - 3},${height * 0.65}`}
          stroke="#FFDBCB"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* Legs */}
        <Path
          d={`M${width / 2 - 30},${height * 0.80} L${width / 2 - 30},${height * 0.84}`}
          stroke="#2C3E50"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <Path
          d={`M${width / 2 - 20},${height * 0.80} L${width / 2 - 20},${height * 0.84}`}
          stroke="#2C3E50"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Boots */}
        <Path
          d={`M${width / 2 - 37},${height * 0.845} L${width / 2 - 23},${height * 0.845}`}
          stroke="#37474F"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Path
          d={`M${width / 2 - 27},${height * 0.845} L${width / 2 - 13},${height * 0.845}`}
          stroke="#37474F"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Fishing rod */}
        <Path
          d={`M${width / 2 - 30},${height * 0.78} L${width / 2 - 8 + (gameState === 'casting' ? -5 : gameState === 'reeling' ? 3 : 0)},${height * 0.32 + (gameState === 'casting' ? 3 : gameState === 'reeling' ? -2 : 0)}`}
          stroke={currentRod.color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Rod handle grip */}
        <Path
          d={`M${width / 2 - 28},${height * 0.70} L${width / 2 - 26},${height * 0.72}`}
          stroke="#5D4037"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Fishing line */}
        <Path
          d={`M${width / 2 - 10},${height * 0.25} Q${(width / 2 - 10 + bobberPos.x) / 2},${(height * 0.25 + bobberPos.y) / 2} ${bobberPos.x},${bobberPos.y}`}
          stroke="#2E7D32"
          strokeWidth={1.5}
          fill="none"
          opacity="0.8"
        />
        <Circle
          cx={bobberPos.x}
          cy={bobberPos.y}
          r="10"
          fill="#E74C3C"
          stroke="#C0392B"
          strokeWidth="2"
        />
        
        {/* Boat deck at bottom */}
        <Path 
          d={`M0,${height * 0.85} L${width},${height * 0.85} L${width},${height} L0,${height}Z`} 
          fill="url(#boatDeck)" 
        />
        
        {/* Deck planks */}
        {Array.from({ length: 6 }, (_, i) => (
          <Path
            key={`plank-${i}`}
            d={`M0,${height * 0.86 + i * 18} L${width},${height * 0.86 + i * 18}`}
            stroke="#3E2723"
            strokeWidth="1.5"
            opacity="0.4"
          />
        ))}
        
        {/* Deck plank shadows for depth */}
        {Array.from({ length: 6 }, (_, i) => (
          <Path
            key={`plank-shadow-${i}`}
            d={`M0,${height * 0.86 + i * 18 + 1} L${width},${height * 0.86 + i * 18 + 1}`}
            stroke="#2E1A15"
            strokeWidth="0.8"
            opacity="0.3"
          />
        ))}
        
        {/* Left boat railing */}
        <Path
          d={`M18,${height * 0.77} L18,${height * 0.85} M24,${height * 0.77} L24,${height * 0.85} M30,${height * 0.77} L30,${height * 0.85} M36,${height * 0.77} L36,${height * 0.85}`}
          stroke="#6D4C41"
          strokeWidth="3.5"
        />
        <Path
          d={`M15,${height * 0.77} L40,${height * 0.77}`}
          stroke="#8D6E63"
          strokeWidth="5"
        />
        <Path
          d={`M15,${height * 0.76} L40,${height * 0.76}`}
          stroke="#A1887F"
          strokeWidth="2"
        />
        
        {/* Right boat railing */}
        <Path
          d={`M${width - 18},${height * 0.77} L${width - 18},${height * 0.85} M${width - 24},${height * 0.77} L${width - 24},${height * 0.85} M${width - 30},${height * 0.77} L${width - 30},${height * 0.85} M${width - 36},${height * 0.77} L${width - 36},${height * 0.85}`}
          stroke="#6D4C41"
          strokeWidth="3.5"
        />
        <Path
          d={`M${width - 40},${height * 0.77} L${width - 15},${height * 0.77}`}
          stroke="#8D6E63"
          strokeWidth="5"
        />
        <Path
          d={`M${width - 40},${height * 0.76} L${width - 15},${height * 0.76}`}
          stroke="#A1887F"
          strokeWidth="2"
        />
        
        {/* Fishing rod holder */}
        <Circle cx={width - 50} cy={height * 0.825} r="10" fill="#37474F" stroke="#263238" strokeWidth="2" />
        <Circle cx={width - 50} cy={height * 0.825} r="7" fill="none" stroke="#455A64" strokeWidth="1.5" />
        <Circle cx={width - 50} cy={height * 0.825} r="3" fill="#263238" />
        
        {/* Tackle box */}
        <Path
          d={`M50,${height * 0.88} L120,${height * 0.88} L120,${height * 0.92} L50,${height * 0.92}Z`}
          fill="#455A64"
          stroke="#37474F"
          strokeWidth="1"
        />
        <Path
          d={`M55,${height * 0.885} L65,${height * 0.885} M75,${height * 0.885} L85,${height * 0.885} M95,${height * 0.885} L105,${height * 0.885}`}
          stroke="#263238"
          strokeWidth="1"
        />
        
        {/* Boat cleats */}
        <Path
          d={`M${width * 0.15},${height * 0.82} L${width * 0.25},${height * 0.82}`}
          stroke="#37474F"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d={`M${width * 0.75},${height * 0.82} L${width * 0.85},${height * 0.82}`}
          stroke="#37474F"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Boat compass/depth finder */}
        <Circle cx={width * 0.85} cy={height * 0.12} r="25" fill="#263238" stroke="#37474F" strokeWidth="2" />
        <Circle cx={width * 0.85} cy={height * 0.12} r="20" fill="#37474F" />
        <Circle cx={width * 0.85} cy={height * 0.12} r="3" fill="#4CAF50" />
        <Path
          d={`M${width * 0.85},${height * 0.12 - 15} L${width * 0.85},${height * 0.12 - 8}`}
          stroke="#4CAF50"
          strokeWidth="2"
        />
        
        {/* Life preserver */}
        <Circle cx={width * 0.12} cy={height * 0.15} r="18" fill="#FF5722" stroke="#D84315" strokeWidth="2" />
        <Circle cx={width * 0.12} cy={height * 0.15} r="12" fill="none" stroke="#FFF" strokeWidth="3" />
        
        {/* Boat wake in water */}
        <Path
          d={`M${width * 0.3},${height * 0.78} Q${width * 0.4},${height * 0.75} ${width * 0.5},${height * 0.78} Q${width * 0.6},${height * 0.80} ${width * 0.7},${height * 0.78}`}
          stroke="#E3F2FD"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
      </Svg>

      {/* Modern Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>SCORE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.coinValue}>{coins}</Text>
            <Text style={styles.statLabel}>COINS</Text>
          </View>
        </View>
        

        
        <TouchableOpacity onPress={() => setShowShop(true)} style={styles.modernShopButton}>
          <Text style={styles.shopIcon}>🏪</Text>
        </TouchableOpacity>
      </View>

      {/* Modern Equipment Panel */}
      <View style={styles.equipmentPanel}>
        <View style={styles.equipmentCard}>
          <View style={styles.equipmentItem}>
            <View style={styles.equipmentIcon}>
              <Text style={styles.equipmentEmoji}>🎣</Text>
            </View>
            <Text style={styles.equipmentName}>{currentRod.name}</Text>
          </View>
          <View style={styles.equipmentItem}>
            <View style={styles.equipmentIcon}>
              <Text style={styles.equipmentEmoji}>🪱</Text>
            </View>
            <Text style={styles.equipmentName}>{currentBait.name}</Text>
          </View>
          <View style={styles.equipmentItem}>
            <View style={styles.equipmentIcon}>
              <Text style={styles.equipmentEmoji}>📍</Text>
            </View>
            <Text style={styles.equipmentName}>{currentLocation.name}</Text>
          </View>
        </View>
      </View>

      {/* Modern Reel Challenge Interface */}
      {reelChallenge && reelChallenge.active && (
        <View style={styles.modernReelChallenge}>
          <View style={styles.challengeHeader}>
            <Text style={styles.modernChallengeTitle}>REELING IN</Text>
            <Text style={styles.fishNameText}>{currentFish?.type.name.toUpperCase()}</Text>
          </View>
          
          <View style={styles.modernReelContainer}>
            <View style={styles.modernReelTrack}>
              {challengeZones.map((zone, index) => (
                <View 
                  key={index}
                  style={[
                    styles.modernReelZone, 
                    { 
                      left: `${zone.start}%`, 
                      width: `${zone.end - zone.start}%`,
                      backgroundColor: zone.hit ? '#00E676' : '#FF6B35',
                      shadowColor: zone.hit ? '#00E676' : '#FF6B35',
                    }
                  ]} 
                />
              ))}
              <View style={[styles.modernReelIndicator, { left: `${reelProgress}%` }]} />
            </View>
          </View>
          
          <TouchableOpacity onPress={handleReelTap} style={styles.modernReelButton}>
            <Text style={styles.modernReelButtonText}>TAP</Text>
            <Text style={styles.reelButtonSubtext}>Hit the zones!</Text>
          </TouchableOpacity>
          
          <View style={styles.challengeTimerContainer}>
            <Text style={styles.modernChallengeTimer}>
              {(reelChallenge.timer / 1000).toFixed(1)}s
            </Text>
          </View>
        </View>
      )}

      {biteIndicator && (
        <View style={styles.modernBiteAlert}>
          <View style={styles.biteAlertContent}>
            <Text style={styles.biteAlertIcon}>🐟</Text>
            <Text style={styles.modernBiteText}>FISH ON!</Text>
            <Text style={styles.biteAlertSubtext}>Get ready to reel!</Text>
          </View>
        </View>
      )}

      {/* Modern Shop Modal */}
      {showShop && (
        <View style={styles.modernShopModal}>
          <View style={styles.modernShopHeader}>
            <View>
              <Text style={styles.modernShopTitle}>FISHING SHOP</Text>
              <Text style={styles.shopSubtitle}>Upgrade your gear</Text>
            </View>
            <TouchableOpacity onPress={() => setShowShop(false)} style={styles.modernCloseButton}>
              <Text style={styles.modernCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modernShopContent}>
            <View style={styles.modernShopSection}>
              <Text style={styles.modernSectionTitle}>FISHING RODS</Text>
              {rodTypes.map(rod => (
                <View key={rod.id} style={styles.modernShopItem}>
                  <View style={styles.modernItemInfo}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.modernItemName}>{rod.name}</Text>
                      {currentRod.id === rod.id && (
                        <View style={styles.equippedBadge}>
                          <Text style={styles.equippedBadgeText}>EQUIPPED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modernItemDesc}>{rod.description}</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statBadge}>
                        <Text style={styles.statBadgeText}>+{Math.round(rod.biteBonus * 100)}% BITE</Text>
                      </View>
                      <View style={styles.statBadge}>
                        <Text style={styles.statBadgeText}>+{Math.round(rod.strengthBonus * 100)}% POWER</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.modernItemActions}>
                    {ownedRods.includes(rod.id) ? (
                      <TouchableOpacity 
                        onPress={() => equipItem(rod, 'rod')}
                        style={[styles.modernEquipButton, currentRod.id === rod.id && styles.modernEquippedButton]}
                      >
                        <Text style={styles.modernEquipButtonText}>
                          {currentRod.id === rod.id ? 'ACTIVE' : 'EQUIP'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => buyItem(rod, 'rod')}
                        style={styles.modernBuyButton}
                      >
                        <Text style={styles.modernBuyButtonText}>{rod.price}</Text>
                        <Text style={styles.coinsText}>COINS</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.shopSection}>
              <Text style={styles.sectionTitle}>🪱 Bait</Text>
              {baitTypes.map(bait => (
                <View key={bait.id} style={styles.shopItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{bait.name}</Text>
                    <Text style={styles.itemDesc}>{bait.description}</Text>
                    <Text style={styles.itemStats}>Bite Bonus: +{Math.round(bait.biteBonus * 100)}%</Text>
                  </View>
                  <View style={styles.itemActions}>
                    {ownedBait.includes(bait.id) ? (
                      <TouchableOpacity 
                        onPress={() => equipItem(bait, 'bait')}
                        style={[styles.equipButton, currentBait.id === bait.id && styles.equippedButton]}
                      >
                        <Text style={styles.equipButtonText}>
                          {currentBait.id === bait.id ? 'Equipped' : 'Equip'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => buyItem(bait, 'bait')}
                        style={styles.buyButton}
                      >
                        <Text style={styles.buyButtonText}>💰 {bait.price}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.shopSection}>
              <Text style={styles.sectionTitle}>🌄 Locations</Text>
              {locations.map(location => (
                <View key={location.id} style={styles.shopItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{location.name}</Text>
                    <Text style={styles.itemDesc}>New fishing environment</Text>
                  </View>
                  <View style={styles.itemActions}>
                    {unlockedLocations.includes(location.id) ? (
                      <TouchableOpacity 
                        onPress={() => equipItem(location, 'location')}
                        style={[styles.equipButton, currentLocation.id === location.id && styles.equippedButton]}
                      >
                        <Text style={styles.equipButtonText}>
                          {currentLocation.id === location.id ? 'Current' : 'Select'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => buyItem(location, 'location')}
                        style={styles.buyButton}
                      >
                        <Text style={styles.buyButtonText}>💰 {location.price}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Modern Bottom Controls */}
      <View style={styles.bottomControls}>
        {gameState === 'waiting' && !gameEnded && (
          <TouchableOpacity onPress={castLine} style={styles.modernCastButton}>
            <View style={styles.castButtonContent}>
              <Text style={styles.castIcon}>🎣</Text>
              <Text style={styles.castButtonText}>CAST LINE</Text>
            </View>
          </TouchableOpacity>
        )}
        {gameState === 'casting' && (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>CASTING...</Text>
            <View style={styles.loadingDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        )}
        {gameState === 'fishing' && (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>WAITING FOR BITE</Text>
            <Text style={styles.statusSubtext}>Stay patient...</Text>
          </View>
        )}
        {gameState === 'reeling' && (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>REEL CHALLENGE</Text>
            <Text style={styles.statusSubtext}>Hit the glowing zones!</Text>
          </View>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  
  // Modern Top Bar
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  coinValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },

  modernShopButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shopIcon: {
    fontSize: 24,
  },
  
  // Modern Equipment Panel
  equipmentPanel: {
    position: 'absolute',
    top: 134,
    left: 16,
    zIndex: 90,
  },
  equipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: '#F1F5F9',
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentIcon: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  equipmentEmoji: {
    fontSize: 12,
  },
  equipmentName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  
  // Modern Reel Challenge
  modernReelChallenge: {
    position: 'absolute',
    top: height * 0.15,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1000,
    borderWidth: 0.5,
    borderColor: '#F1F5F9',
  },
  challengeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modernChallengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
  },
  fishNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  modernReelContainer: {
    width: '100%',
    height: 48,
    marginBottom: 24,
  },
  modernReelTrack: {
    width: '100%',
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  modernReelZone: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  modernReelIndicator: {
    position: 'absolute',
    width: 6,
    height: 28,
    backgroundColor: '#0F172A',
    top: -10,
    borderRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  modernReelButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    paddingHorizontal: 52,
    borderRadius: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernReelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  reelButtonSubtext: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  challengeTimerContainer: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  modernChallengeTimer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  
  // Modern Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 44,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  modernCastButton: {
    backgroundColor: '#10B981',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 36,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  castButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  castIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  castButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 220,
    borderWidth: 0.5,
    borderColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  statusSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginHorizontal: 2,
  },

  
  // Modern Shop Styles
  modernShopModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F0F4F8',
    zIndex: 2000,
  },
  modernShopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 28,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    paddingTop: 64,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  modernShopTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shopSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  modernCloseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14,
    borderRadius: 20,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modernCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modernShopContent: {
    flex: 1,
    padding: 24,
  },
  modernShopSection: {
    marginBottom: 40,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.8,
    marginBottom: 24,
    textTransform: 'uppercase',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modernShopItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F8FAFC',
    marginHorizontal: 4,
  },
  modernItemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernItemName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  equippedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  equippedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modernItemDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.3,
  },
  modernItemActions: {
    alignItems: 'flex-end',
  },
  modernBuyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernBuyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  coinsText: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modernEquipButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernEquipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modernEquippedButton: {
    backgroundColor: '#F59E0B',
  },
  
  // Modern Bite Alert
  modernBiteAlert: {
    position: 'absolute',
    top: height * 0.4,
    left: 16,
    right: 16,
    zIndex: 1500,
  },
  biteAlertContent: {
    backgroundColor: '#10B981',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  biteAlertIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modernBiteText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  biteAlertSubtext: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default FishingGame;
