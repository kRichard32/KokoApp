// app/screens/VideoCallScreen.tsx
import { FC, useState, useEffect } from "react"
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
  Dimensions,
  StatusBar,
} from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface VideoCallScreenProps extends AppStackScreenProps<"VideoCall"> {}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export const VideoCallScreen: FC<VideoCallScreenProps> = ({ navigation, route }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  // 从路由参数获取联系人信息
  const { conversationId, conversationName } = route.params

  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)

  // 通话计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 格式化通话时长
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 结束通话
  const endCall = () => {
    navigation.goBack()
  }

  // 切换静音
  const toggleMute = () => {
    setIsMuted(prev => !prev)
  }

  // 切换摄像头
  const toggleVideo = () => {
    setIsVideoOn(prev => !prev)
  }

  // 切换扬声器
  const toggleSpeaker = () => {
    setIsSpeakerOn(prev => !prev)
  }

  // 切换到语音通话
  const switchToVoiceCall = () => {
    setIsVideoOn(false)
    // TODO: 实际切换到语音模式
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={[]}
      contentContainerStyle={themed($container)}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* 远程视频区域 - 医生 */}
      <View style={$remoteVideoContainer}>
        {isVideoOn ? (
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=600&fit=crop&crop=face" }}
            style={$remoteVideo}
            defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
          />
        ) : (
          <View style={$videoOffContainer}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face" }}
              style={$avatarLarge}
              defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
            />
            <Text style={$videoOffText}>Camera is off</Text>
          </View>
        )}
        
        {/* 通话信息覆盖层 */}
        <View style={$callInfoOverlay}>
          <Text style={$contactNameLarge}>{conversationName}</Text>
          <Text style={$callDurationText}>{formatCallDuration(callDuration)}</Text>
          <Text style={$callStatusText}>Video Call</Text>
        </View>
      </View>

      {/* 本地视频区域 - 用户自己 */}
      <View style={$localVideoContainer}>
        {isVideoOn ? (
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop&crop=face" }}
            style={$localVideo}
            defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
          />
        ) : (
          <View style={$localVideoOff}>
            <Text style={$localVideoOffText}>📷</Text>
          </View>
        )}
      </View>

      {/* 控制按钮区域 */}
      <View style={$controlsContainer}>
        <View style={$controlsRow}>
          {/* 静音按钮 */}
          <Pressable
            style={[
              $controlButton,
              isMuted ? $controlButtonActive : $controlButtonInactive
            ]}
            onPress={toggleMute}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            <Text style={[
              $controlButtonIcon,
              isMuted ? $controlButtonIconActive : $controlButtonIconInactive
            ]}>
              {isMuted ? "🔇" : "🎤"}
            </Text>
            <Text style={[
              $controlButtonText,
              isMuted ? $controlButtonTextActive : $controlButtonTextInactive
            ]}>
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </Pressable>

          {/* 视频切换按钮 */}
          <Pressable
            style={[
              $controlButton,
              !isVideoOn ? $controlButtonActive : $controlButtonInactive
            ]}
            onPress={toggleVideo}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            <Text style={[
              $controlButtonIcon,
              !isVideoOn ? $controlButtonIconActive : $controlButtonIconInactive
            ]}>
              {isVideoOn ? "📹" : "📷"}
            </Text>
            <Text style={[
              $controlButtonText,
              !isVideoOn ? $controlButtonTextActive : $controlButtonTextInactive
            ]}>
              {isVideoOn ? "Camera" : "Camera"}
            </Text>
          </Pressable>

          {/* 扬声器按钮 */}
          <Pressable
            style={[
              $controlButton,
              isSpeakerOn ? $controlButtonActive : $controlButtonInactive
            ]}
            onPress={toggleSpeaker}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
          >
            <Text style={[
              $controlButtonIcon,
              isSpeakerOn ? $controlButtonIconActive : $controlButtonIconInactive
            ]}>
              {isSpeakerOn ? "🔊" : "🔈"}
            </Text>
            <Text style={[
              $controlButtonText,
              isSpeakerOn ? $controlButtonTextActive : $controlButtonTextInactive
            ]}>
              Speaker
            </Text>
          </Pressable>
        </View>

        {/* 底部操作按钮 */}
        <View style={$bottomControlsRow}>
          {/* 切换到语音通话 */}
          <Pressable
            style={$secondaryButton}
            onPress={switchToVoiceCall}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Switch to voice call"
          >
            <Text style={$secondaryButtonIcon}>📞</Text>
            <Text style={$secondaryButtonText}>Voice</Text>
          </Pressable>

          {/* 结束通话按钮 */}
          <Pressable
            style={$endCallButton}
            onPress={endCall}
            accessible
            accessibilityRole="button"
            accessibilityLabel="End call"
          >
            <Text style={$endCallIcon}>📞</Text>
            <Text style={$endCallText}>End Call</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "#000000",
})

const $remoteVideoContainer: ViewStyle = {
  flex: 1,
  position: "relative",
}

const $remoteVideo: ImageStyle = {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
}

const $videoOffContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#1a1a1a",
}

const $avatarLarge: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  marginBottom: 20,
  backgroundColor: "#333",
}

const $videoOffText: TextStyle = {
  fontSize: 18,
  color: "#FFFFFF",
  opacity: 0.8,
}

const $callInfoOverlay: ViewStyle = {
  position: "absolute",
  top: 60,
  left: 0,
  right: 0,
  alignItems: "center",
  paddingHorizontal: 20,
}

const $contactNameLarge: TextStyle = {
  fontSize: 28,
  fontWeight: "600",
  color: "#FFFFFF",
  marginBottom: 8,
  textAlign: "center",
  textShadowColor: "rgba(0, 0, 0, 0.7)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
}

const $callDurationText: TextStyle = {
  fontSize: 20,
  color: "#FFFFFF",
  marginBottom: 4,
  fontWeight: "500",
  textShadowColor: "rgba(0, 0, 0, 0.7)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
}

const $callStatusText: TextStyle = {
  fontSize: 16,
  color: "#34C759",
  fontWeight: "500",
  textShadowColor: "rgba(0, 0, 0, 0.7)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
}

const $localVideoContainer: ViewStyle = {
  position: "absolute",
  top: 120,
  right: 20,
  width: 120,
  height: 160,
  borderRadius: 12,
  overflow: "hidden",
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
}

const $localVideo: ImageStyle = {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
}

const $localVideoOff: ViewStyle = {
  width: "100%",
  height: "100%",
  backgroundColor: "#333",
  justifyContent: "center",
  alignItems: "center",
}

const $localVideoOffText: TextStyle = {
  fontSize: 24,
  opacity: 0.6,
}

const $controlsContainer: ViewStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  paddingBottom: 40,
  paddingHorizontal: 20,
}

const $controlsRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-around",
  marginBottom: 20,
}

const $controlButton: ViewStyle = {
  alignItems: "center",
  paddingVertical: 18,
  paddingHorizontal: 22,
  borderRadius: 18,
  minWidth: 90,
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
}

const $controlButtonActive: ViewStyle = {
  backgroundColor: "#FF3B30",
}

const $controlButtonInactive: ViewStyle = {
  backgroundColor: "#FF6B60", // 更亮的红色，老年人更容易看清
}

const $controlButtonIcon: TextStyle = {
  fontSize: 32,
  marginBottom: 8,
}

const $controlButtonIconActive: TextStyle = {
  color: "#FFFFFF",
}

const $controlButtonIconInactive: TextStyle = {
  color: "#FFFFFF",
}

const $controlButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
}

const $controlButtonTextActive: TextStyle = {
  color: "#FFFFFF",
}

const $controlButtonTextInactive: TextStyle = {
  color: "#FFFFFF",
}

const $bottomControlsRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-evenly",
  alignItems: "center",
  paddingHorizontal: 40,
}

const $secondaryButton: ViewStyle = {
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  minWidth: 70,
}

const $secondaryButtonIcon: TextStyle = {
  fontSize: 24,
  marginBottom: 4,
  color: "#FFFFFF",
}

const $secondaryButtonText: TextStyle = {
  fontSize: 12,
  color: "#FFFFFF",
  fontWeight: "500",
}

const $endCallButton: ViewStyle = {
  alignItems: "center",
  paddingVertical: 20,
  paddingHorizontal: 32,
  borderRadius: 25,
  backgroundColor: "#FF3B30",
  minWidth: 120,
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 6,
}

const $endCallIcon: TextStyle = {
  fontSize: 32,
  marginBottom: 6,
  color: "#FFFFFF",
  transform: [{ rotate: "135deg" }],
}

const $endCallText: TextStyle = {
  fontSize: 18,
  color: "#FFFFFF",
  fontWeight: "600",
}
