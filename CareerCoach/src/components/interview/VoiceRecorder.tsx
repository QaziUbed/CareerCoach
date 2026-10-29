import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  maxDuration?: number;
}

export default function VoiceRecorder({ onRecordingComplete, maxDuration = 180 }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      
      if (status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (error) {
      console.error('Failed to get permissions:', error);
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      return;
    }

    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      setRecordedUri(null);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      timerInterval.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setRecordedUri(uri);
        onRecordingComplete(uri, duration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const pauseRecording = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (duration < 45) return '#F59E0B';
    if (duration > 180) return '#EF4444';
    if (duration >= 60 && duration <= 120) return '#10B981';
    return '#64748B';
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(duration)}
        </Text>
        <Text style={styles.timerHint}>
          {duration < 45 && 'Too short - aim for 60-120s'}
          {duration >= 45 && duration < 60 && 'Keep going...'}
          {duration >= 60 && duration <= 120 && 'Perfect length!'}
          {duration > 120 && duration <= 180 && 'Getting long...'}
          {duration > 180 && 'Too long - wrap it up!'}
        </Text>
      </View>

      <View style={styles.recordButtonContainer}>
        {isRecording && (
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
        )}
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordButtonActive : styles.recordButtonIdle,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          <View style={isRecording ? styles.stopIcon : styles.micIcon}>
            {!isRecording && <Text style={styles.micEmoji}>🎤</Text>}
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.recordHint}>
        {isRecording ? 'Tap to stop recording' : recordedUri ? 'Tap to record again' : 'Tap to start recording'}
      </Text>

      {recordedUri && !isRecording && (
        <View style={styles.playbackContainer}>
          <IconButton
            icon={isPlaying ? 'pause' : 'play'}
            size={32}
            iconColor="#2563EB"
            onPress={isPlaying ? pauseRecording : playRecording}
            style={styles.playButton}
          />
          <Text style={styles.playbackText}>
            {isPlaying ? 'Playing your answer...' : 'Play your answer'}
          </Text>
        </View>
      )}

      {!isRecording && !recordedUri && (
        <View style={styles.guideContainer}>
          <Text style={styles.guideText}>Ideal answer: 60-120 seconds</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  timerHint: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  recordButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordButtonIdle: {
    backgroundColor: '#2563EB',
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  micIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micEmoji: {
    fontSize: 48,
  },
  stopIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  recordHint: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginTop: 16,
  },
  playButton: {
    margin: 0,
  },
  playbackText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  guideContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  guideText: {
    fontSize: 12,
    color: '#64748B',
  },
});
