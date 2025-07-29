import React, { useState, useEffect } from 'react';
import { View, Pressable, ViewStyle, TextStyle, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import { Text } from './Text';

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

type VoiceCommandButtonProps = {
  onCommand?: (command: string) => void;
  onError?: (error: string) => void;
  style?: ViewStyle;
};

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({ 
  onCommand, 
  onError,
  style 
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const textOpacityAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Cleanup effect to reset state when component unmounts or navigation occurs
  useEffect(() => {
    return () => {
      // Clean up any ongoing recording when component unmounts
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
      // Reset all states
      setIsRecording(false);
      setIsProcessing(false);
      setShowResult(false);
      setRecognizedText("");
      setRecording(null);
    };
  }, [recording]);

  const requestPermission = async () => {
    try {
      console.log('VoiceCommandButton: Requesting audio permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('VoiceCommandButton: Permission status:', status);
      
      if (status === 'granted') {
        return true;
      } else {
        console.log('VoiceCommandButton: Permission denied. Status:', status);
        if (onError) {
          onError("Audio permission denied. Please enable microphone access in your device settings.");
        }
        return false;
      }
    } catch (error) {
      console.error('VoiceCommandButton: Error requesting permissions:', error);
      if (onError) {
        onError("Error requesting microphone permission. Please try again.");
      }
      return false;
    }
  };

  const startRecording = async () => {
    console.log('VoiceCommandButton: Starting recording...');
    const granted = await requestPermission();
    if (!granted) {
      console.log('VoiceCommandButton: Audio permission not granted');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: 1, // PCM_16BIT
          audioEncoder: 1, // PCM_16BIT
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: 96, // HIGH
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });

      setRecording(recording);
      setIsRecording(true);
      console.log('VoiceCommandButton: Recording started successfully');
    } catch (error) {
      console.error('VoiceCommandButton: Error starting recording:', error);
      setRecording(null);
      setIsRecording(false);
      if (onError) {
        onError("Error starting recording. Please try again.");
      }
    }
  };

  const stopRecordingAndSend = async () => {
    console.log('VoiceCommandButton: stopRecordingAndSend called');
    if (!recording) {
      console.log('VoiceCommandButton: No recording to stop');
      return;
    }

    setIsRecording(false);
    setIsProcessing(true);

    try {
      console.log('VoiceCommandButton: Stopping and unloading recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      console.log('VoiceCommandButton: Recording stopped, URI:', uri);

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'voice_command.wav',
        type: 'audio/wav',
      } as any);
      
      console.log('VoiceCommandButton: Sending audio to navigation transcribe endpoint...');
      const response = await axios.post(`${serverUrl}/api/navigation/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      const data = response.data;
      console.log('VoiceCommandButton: Server response:', data);
      
      if (data.command || data.text || data.transcription) {
        const command = data.command || data.text || data.transcription;
        console.log('VoiceCommandButton: Calling onCommand with:', command);
        
        // Show the "I heard" result
        setRecognizedText(command);
        setIsProcessing(false);
        setShowResult(true);
        
        // Animate the result in
        Animated.parallel([
          Animated.timing(textOpacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.05,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          })
        ]).start();
        
        // Wait 1.5 seconds then execute command and hide overlay
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(textOpacityAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            })
          ]).start(() => {
            // Reset all states before executing command
            setShowResult(false);
            setRecognizedText("");
            setIsRecording(false);
            setIsProcessing(false);
            setRecording(null);
            
            if (onCommand) {
              onCommand(command);
            }
          });
        }, 1500);
        
      } else if (onError) {
        setIsProcessing(false);
        setIsRecording(false);
        setShowResult(false);
        setRecognizedText("");
        onError("No command recognized. Please try again.");
      }
    } catch (error) {
      console.error('VoiceCommandButton: Error sending voice command:', error);
      // Reset all states on error
      setIsProcessing(false);
      setIsRecording(false);
      setShowResult(false);
      setRecognizedText("");
      setRecording(null);
      
      if (onError) {
        onError("Failed to process voice command. Please try again.");
      }
    }
  };

  const handlePress = () => {
    if (isProcessing) {
      return; // Prevent interaction while processing
    }

    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  const getButtonText = () => {
    if (isProcessing) return "🔄";
    if (isRecording) return "🔴";
    return "🎤";
  };

  const getButtonLabel = () => {
    if (isProcessing) return "Processing voice command...";
    if (isRecording) return "Tap to stop recording and send command";
    return "Tap to start voice command";
  };

  return (
    <>
      <Pressable
        style={[
          $voiceCommandButton,
          isRecording && $voiceCommandButtonRecording,
          isProcessing && $voiceCommandButtonProcessing,
          style
        ]}
        onPress={handlePress}
        disabled={isProcessing}
        accessible
        accessibilityRole="button"
        accessibilityLabel={getButtonLabel()}
      >
        <Text style={[
          $voiceCommandButtonText,
          isRecording ? $voiceIconRecording : $voiceIconIdle
        ]}>
          {getButtonText()}
        </Text>
        <Text style={[
          $voiceCommandButtonLabel,
          isRecording ? $voiceLabelRecording : $voiceLabelIdle
        ]}>
          {isProcessing ? "Processing..." : (isRecording ? "Listening..." : "Tap to speak")}
        </Text>
      </Pressable>

      {/* Recording/Processing Overlay */}
      {(isRecording || isProcessing || showResult) && (
        <View
          pointerEvents="none"
          style={$recordingOverlay}
        >
          {/* Siri-style interface */}
          <View style={$siriContainer}>
            {isProcessing ? (
              <View style={$siriProcessingContainer}>
                <View style={$siriWaveformContainer}>
                  <Text style={$siriIcon}>🗣️</Text>
                  <View style={$siriWaveform}>
                    <View style={[$siriWaveBar, { height: 20 }]} />
                    <View style={[$siriWaveBar, { height: 35 }]} />
                    <View style={[$siriWaveBar, { height: 15 }]} />
                    <View style={[$siriWaveBar, { height: 28 }]} />
                    <View style={[$siriWaveBar, { height: 22 }]} />
                  </View>
                </View>
                <Text style={$siriProcessingText}>Processing...</Text>
              </View>
            ) : isRecording ? (
              <View style={$siriProcessingContainer}>
                <View style={$siriWaveformContainer}>
                  <Text style={$siriIcon}>🎤</Text>
                  <View style={$siriWaveform}>
                    <View style={[$siriWaveBar, { height: 25 }]} />
                    <View style={[$siriWaveBar, { height: 40 }]} />
                    <View style={[$siriWaveBar, { height: 20 }]} />
                    <View style={[$siriWaveBar, { height: 33 }]} />
                    <View style={[$siriWaveBar, { height: 27 }]} />
                  </View>
                </View>
                <Text style={$siriProcessingText}>Listening...</Text>
              </View>
            ) : (
              showResult && recognizedText && (
                <Animated.View style={[
                  $siriResultContainer,
                  { 
                    opacity: textOpacityAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}>
                  <View style={$siriResultHeader}>
                    <Text style={$siriResultIcon}>✓</Text>
                    <Text style={$siriResultTitle}>I heard:</Text>
                  </View>
                  <Text style={$siriResultText}>"{recognizedText}"</Text>
                  <View style={$siriResultActions}>
                    <Text style={$siriResultHint}>
                      Processing your request...
                    </Text>
                  </View>
                </Animated.View>
              )
            )}
          </View>
        </View>
      )}
    </>
  );
};

// Styles
const $voiceCommandButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 25,
  paddingVertical: 16,
  paddingHorizontal: 24,
  marginBottom: 20,
  borderWidth: 2,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const $voiceCommandButtonRecording: ViewStyle = {
  backgroundColor: "#FFE4E1",
  borderColor: "#FF6B6B",
};

const $voiceCommandButtonProcessing: ViewStyle = {
  backgroundColor: "#FFF3CD",
  borderColor: "#FF9500",
};

const $voiceCommandButtonText: TextStyle = {
  marginRight: 12,
  fontSize: 40,
};

const $voiceIconIdle: TextStyle = {
  // Icon styles when idle
};

const $voiceIconRecording: TextStyle = {
  // Icon styles when recording
};

const $voiceCommandButtonLabel: TextStyle = {
  color: "#2D5016",
  fontSize: 24,
  fontWeight: "500",
};

const $voiceLabelIdle: TextStyle = {
  // Label styles when idle
};

const $voiceLabelRecording: TextStyle = {
  color: "#FF6B6B",
};

const $recordingIndicatorText: TextStyle = {
  position: "absolute",
  bottom: -20,
  fontSize: 10,
  color: "#FF3B30",
  fontWeight: "600",
  textAlign: "center",
};

const $processingIndicatorText: TextStyle = {
  position: "absolute",
  bottom: -20,
  fontSize: 10,
  color: "#FF9500",
  fontWeight: "600",
  textAlign: "center",
};

const $recordingOverlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  zIndex: 500,
};

// Siri-style interface styles
const $siriContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
};

const $siriProcessingContainer: ViewStyle = {
  alignItems: "center",
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderRadius: 24,
  padding: 32,
  minWidth: 280,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 16,
};

const $siriWaveformContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 20,
};

const $siriIcon: TextStyle = {
  fontSize: 24,
  marginRight: 16,
};

const $siriWaveform: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
};

const $siriWaveBar: ViewStyle = {
  width: 4,
  backgroundColor: "#007AFF",
  borderRadius: 2,
  opacity: 0.8,
};

const $siriProcessingText: TextStyle = {
  fontSize: 28,
  fontWeight: "500",
  color: "#1D1D1F",
  textAlign: "center",
};

const $siriResultContainer: ViewStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderRadius: 28,
  padding: 36,
  maxWidth: "92%",
  minWidth: 320,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 12,
  },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 20,
};

const $siriResultHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 20,
};

const $siriResultIcon: TextStyle = {
  fontSize: 20,
  color: "#34C759",
  marginRight: 12,
  fontWeight: "bold",
};

const $siriResultTitle: TextStyle = {
  fontSize: 26,
  fontWeight: "600",
  color: "#8E8E93",
};

const $siriResultText: TextStyle = {
  fontSize: 38,
  fontWeight: "600",
  color: "#1D1D1F",
  textAlign: "center",
  lineHeight: 46,
  marginBottom: 24,
  letterSpacing: 0.5,
};

const $siriResultActions: ViewStyle = {
  alignItems: "center",
};

const $siriResultHint: TextStyle = {
  fontSize: 22,
  fontWeight: "500",
  color: "#007AFF",
  textAlign: "center",
};
