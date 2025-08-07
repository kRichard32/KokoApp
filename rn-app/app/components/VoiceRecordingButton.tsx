import React, { useState, useEffect } from 'react';
import { View, Pressable, ViewStyle, TextStyle, StyleSheet, Animated } from 'react-native';
import { Text } from './Text';
import { useAppTheme } from '@/theme/context';
import { Audio } from 'expo-av';
import axios from 'axios';
const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
type VoiceRecordingButtonProps = {
  onCommand?: (command: string) => void;
    onError?: (error: string) => void;
  style?: ViewStyle;
  navigation?: any; 
};

export const VoiceRecordingButton: React.FC<VoiceRecordingButtonProps> = ({ 
  onCommand,
  onError,
  style,
  navigation  
}) => {
  const {
    theme: { colors },
  } = useAppTheme();

  // 语音录制状态
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [navigationMessage, setNavigationMessage] = useState(""); // Store navigation message
  const scaleAnim = useState(new Animated.Value(1))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const textOpacityAnim = useState(new Animated.Value(0))[0];
  // Siri波形动画
  const waveAnim1 = useState(new Animated.Value(0.5))[0];
  const waveAnim2 = useState(new Animated.Value(0.7))[0];
  const waveAnim3 = useState(new Animated.Value(0.3))[0];
  const waveAnim4 = useState(new Animated.Value(0.8))[0];
  const waveAnim5 = useState(new Animated.Value(0.6))[0];

  // Cleanup effect to reset state when component unmounts (navigation occurs)
  useEffect(() => {
    return () => {
      // Clean up any ongoing recording when component unmounts
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
      // Reset all states
      setIsRecording(false);
      setIsProcessing(false);
      setRecognizedText("");
      setRecording(null);
      setNavigationMessage("");
    };
  }, []); // Empty dependency array - only runs on mount/unmount  

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


  /** ====== 语音处理函数 ====== */
  const recordAudio = async() => {
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


  const startRecording = async() => {
    if (isRecording) return; // 防止重复触发
    
    setIsRecording(true);
    // setIsProcessing(true);
    setRecognizedText("");
    textOpacityAnim.setValue(0);
    
    // 按钮放大动画
    Animated.spring(scaleAnim, {
      toValue: 1.2,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();

    // 脉冲动画
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Siri波形动画
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600 + delay,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0.2,
            duration: 600 + delay,
            useNativeDriver: false,
          }),
        ])
      );
    };

    createWaveAnimation(waveAnim1, 0).start();
    createWaveAnimation(waveAnim2, 100).start();
    createWaveAnimation(waveAnim3, 200).start();
    createWaveAnimation(waveAnim4, 50).start();
    createWaveAnimation(waveAnim5, 150).start();

    // 开始模拟语音识别
    await recordAudio();

    console.log("Recording started - implement voice recognition here");
  };

  const stopRecording = async () => {
    if (!isRecording) return; // 防止重复触发
    
    setIsProcessing(true);   
    // 停止所有动画并重置按钮大小
    pulseAnim.stopAnimation();
    waveAnim1.stopAnimation();
    waveAnim2.stopAnimation();
    waveAnim3.stopAnimation();
    waveAnim4.stopAnimation();
    waveAnim5.stopAnimation();
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }), 
    ]).start();

    await stopRecordingAndSend();
  };
  const stopRecordingAndSend = async () => {
    console.log('VoiceCommandButton: stopRecordingAndSend called');
    if (!recording) {
      console.log('VoiceCommandButton: No recording to stop');
      return;
    }

    setIsRecording(false);
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

      if (data.match == "true") {
        const screen = data.screen;
        console.log('VoiceCommandButton: Calling onCommand with:', data.transcription);
        
        // Set navigation message based on screen
        let message = "Processing your request...";
        if (recognizedText.toLowerCase().includes("mary")) {
          message = "Opening chat with Mary...";
        } else {
          const screenName = screen.replace("Screen", "").toLowerCase();
          message = `Navigating to the ${screenName} screen...`;
        }
        setNavigationMessage(message);
        
        // Show the "I heard" result
        setRecognizedText(data.transcription);
        setIsProcessing(false);    
       
        // Wait 1.5 seconds then execute command and hide overlay
        setTimeout(() => {
        // Reset all states before executing command
        setRecognizedText("");
        setIsRecording(false);
        setIsProcessing(false);
        setRecording(null);
        setNavigationMessage("");
        
        if (onCommand) {
            onCommand(data);
        }
        else {
            if (screen ==  "ChatScreen") {
                navigation.navigate("ChatDetail", {
                    conversationId: data.conversationId,
                });
            }
            else if (screen == "FriendScreen"){
                navigation.navigate("People", {  
                });
            }
            else if (screen == "EventScreen"){
              navigation.navigate("Events", {  
                });
            }
            else if (screen == "ReminderScreen"){
              navigation.navigate("Reminders", {  
              });
            }
        }
        }, 2500);
        
      } else if (onError) {
        
        setErrorText("I didn't understand that command.");
        setRecognizedText("please try again");
        setIsProcessing(false);
        setTimeout(() => {
        setErrorText("");
        setRecognizedText("");
        setIsRecording(false);
        setIsProcessing(false);
        setRecording(null);
        setNavigationMessage("");
        onError("No command recognized. Please try again.");
        }, 2500);
      }
      else{
        setErrorText("I didn't understand that command.");
        setRecognizedText("please try again");
        setIsProcessing(false);
        setTimeout(() => {
        setErrorText("");
        setRecognizedText("");
        setIsRecording(false);
        setIsProcessing(false);
        setRecording(null);
        setNavigationMessage("");
        }, 2500);
      }
    } catch (error) {
      console.error('VoiceCommandButton: Error sending voice command:', error);
      // Reset all states on error
      setIsProcessing(false);
      setIsRecording(false);
      setRecognizedText("");
      setRecording(null);
      setNavigationMessage("");
      
      if (onError) {
        onError("Failed to process voice command. Please try again.");
      }
    }
  };
  const handlePress = () => {
    // Disable button when processing or showing results
    if (isProcessing || !!recognizedText) {
      return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      {/* 语音按钮 */}
      <Animated.View
        style={[
          { 
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            zIndex: 1000, // 确保按钮在遮罩之上
            elevation: 1000, // Android elevation
          },
          style
        ]}
      >
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            isProcessing || !!recognizedText
              ? "Processing voice command" 
              : isRecording 
                ? "Tap to stop recording" 
                : "Tap to start voice command"
          }
          onPress={handlePress}
          disabled={isProcessing || !!recognizedText}
          style={[
            $voiceButton,
            { 
              backgroundColor: isProcessing || !!recognizedText
                ? "#E5E5E5" 
                : isRecording 
                  ? "#FFE4E1" 
                  : colors.palette.accent100, 
              borderColor: isProcessing || !!recognizedText
                ? "#CCCCCC" 
                : isRecording 
                  ? "#FF6B6B" 
                  : colors.palette.accent500,
              opacity: isProcessing || !!recognizedText ? 0.6 : 1,
            },
          ]}
        >
          <Text size="xxl" style={$voiceIcon}>
            {isProcessing ? "⏳" : isRecording ? "🔴" : "🎤"}
          </Text>
          <Text preset="formLabel" size="lg" weight="medium" style={$voiceLabel}>
            {isProcessing ? "Processing..." : isRecording ? "Tap to stop" : "Tap to speak"}
          </Text>
        </Pressable>
      </Animated.View>

      {/* 录制时的取消按钮 */}
      {isRecording && (
        <Pressable
          style={$cancelButton}
          onPress={stopRecording}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Cancel recording"
        >
          <Text preset="formLabel" size="md" style={$cancelButtonText}>
            Cancel
          </Text>
        </Pressable>
      )}

      {/* 录制时的背景遮罩 */}
      {(isRecording || isProcessing || recognizedText || errorText) && (
        <View
          pointerEvents="none"
          style={$recordingOverlay}
        >
          {/* Siri风格的语音识别界面 */}
          <View style={$siriContainer}>
            {isRecording ? (
              <View style={$siriProcessingContainer}>
                <View style={$siriWaveformContainer}>
                  <Text style={$siriIcon}>🎤</Text>
                  <View style={$siriWaveform}>
                    <View style={[$siriWaveBar, { height: 20 }]} />
                    <View style={[$siriWaveBar, { height: 35 }]} />
                    <View style={[$siriWaveBar, { height: 15 }]} />
                    <View style={[$siriWaveBar, { height: 28 }]} />
                    <View style={[$siriWaveBar, { height: 22 }]} />
                  </View>
                </View>
                <Text style={$siriProcessingText}>Listening...</Text>
              </View>
            ) : isProcessing ? (
              <View style={$siriProcessingContainer}>
                <View style={$siriWaveformContainer}>
                  <Text style={$siriIcon}>🗣️</Text>
                  <View style={$siriWaveform}>
                    <View style={[$siriWaveBar, { height: 15 }]} />
                    <View style={[$siriWaveBar, { height: 25 }]} />
                    <View style={[$siriWaveBar, { height: 10 }]} />
                    <View style={[$siriWaveBar, { height: 20 }]} />
                    <View style={[$siriWaveBar, { height: 18 }]} />
                  </View>
                </View>
                <Text style={$siriProcessingText}>Processing...</Text>
              </View>
            ) : errorText ? (
                <Animated.View style={[
                    $siriResultContainer,
                    $siriErrorContainer, // Add error-specific styling
                    { 
                    opacity: textOpacityAnim,
                    transform: [{ scale: scaleAnim }]
                    }
                ]}>
                    <View style={$siriResultHeader}>
                    <Text style={$siriErrorIcon}>❌</Text>
                    <Text style={[$siriResultTitle, $siriErrorTitle]}>Error</Text>
                    </View>
                    <Text style={[$siriResultText, $siriErrorText]}>"{errorText}"</Text>
                    <View style={$siriResultActions}>
                    <Text style={[$siriResultHint, $siriErrorHint]}>
                        Please try again...
                    </Text>
                    </View>
                </Animated.View>
                ) :(
              recognizedText && (
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
                      {navigationMessage || "Processing your request..."}
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
const $voiceButton: ViewStyle = {
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

const $voiceIcon: TextStyle = {
  marginRight: 12,
  fontSize: 40,
};

const $voiceLabel: TextStyle = {
  color: "#2D5016",
  fontSize: 24,
};

const $cancelButton: ViewStyle = {
  alignSelf: "center",
  backgroundColor: "#FFF",
  borderRadius: 20,
  paddingVertical: 12,
  paddingHorizontal: 24,
  marginTop: 16,
  borderWidth: 1,
  borderColor: "#FF6B6B",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

const $cancelButtonText: TextStyle = {
  color: "#FF6B6B",
  fontWeight: "600",
};

const $recordingOverlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0, 0, 0, 0.75)", // 更深的背景，像Siri
  zIndex: 500,
};

// Siri风格的样式
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
  backgroundColor: "#007AFF", // iOS蓝色
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
  color: "#34C759", // iOS绿色
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

const $siriErrorContainer: ViewStyle = {
  backgroundColor: "rgba(255, 245, 245, 0.98)", // Light red background
  borderWidth: 2,
  borderColor: "#FF6B6B", // Red border
};

const $siriErrorIcon: TextStyle = {
  fontSize: 24,
  marginRight: 12,
  fontWeight: "bold",
};

const $siriErrorTitle: TextStyle = {
  color: "#DC2626", // Dark red for title
  fontWeight: "700",
};

const $siriErrorText: TextStyle = {
  color: "#991B1B", // Dark red for error message
  fontWeight: "500",
};

const $siriErrorHint: TextStyle = {
  color: "#EF4444", // Medium red for hint text
  fontWeight: "600",
};