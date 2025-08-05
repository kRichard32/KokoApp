// app/screens/VideoCallScreen.tsx
import { FC, useState, useEffect, useRef } from "react"
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
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useAuth } from "@/context/AuthContext"

interface VideoCallScreenProps extends AppStackScreenProps<"VideoCall"> {}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// WebRTC Configuration
const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

export const VideoCallScreen: FC<VideoCallScreenProps> = ({ navigation, route }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  // Get auth context
  const { authToken } = useAuth()

  // 从路由参数获取联系人信息
  const { conversationId, userId } = route.params
  const isInitiator = (route.params as any)?.isInitiator || false

  // WebRTC States - using a different approach for peer connection
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [stompClient, setStompClient] = useState<Client | null>(null)
  
  // Store peer connection using useRef
  const pcRef = useRef<RTCPeerConnection | null>(null)

  // UI States
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callStatus, setCallStatus] = useState('Connecting...')
  const [contactName, setContactName] = useState('Contact')

  // Initialize WebRTC
  useEffect(() => {
    initializeCall()
    return () => {
      cleanup()
    }
  }, [])

  const initializeCall = async () => {
    try {
      console.log('Initializing WebRTC call...')
      
      // Get user media first
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          frameRate: 30,
          facingMode: 'user',
        },
        audio: true,
      })
      console.log('Got user media stream')
      setLocalStream(stream)

      console.log('serverurl',serverUrl)
      // Initialize STOMP connection with SockJS
      const sockjsUrl = serverUrl + '/ws'
      console.log('SockJS URL:', sockjsUrl)
      console.log('Connecting to STOMP server with SockJS...')
      const client = new Client({
        webSocketFactory: () => new SockJS(sockjsUrl, null, { transports: ['websocket', 'xhr-streaming', 'xhr-polling'], withCredentials: true }),
        // Force WebSocket to include credentials in handshake
        forceBinaryWSFrames: false,
        appendMissingNULLonIncoming: true,

        
        onConnect: (frame) => {
          console.log('STOMP connected:', frame)
          
          // Now that STOMP is connected, setup WebRTC
          setupWebRTC(stream, client)
          
          // Subscribe to call events for this conversation
          client.subscribe(`/topic/call/${conversationId}`, (message) => {
            const data = JSON.parse(message.body)
            console.log('Received STOMP message:', data)
            console.log('client', userId)
            if (data.senderId != userId){
              switch (data.type) {
                case "peer-joined":
                  // If initiator, create offer
                  if (isInitiator) {
                    console.log('Creating offer as initiator')
                    createOffer(pcRef.current as RTCPeerConnection, client)
                  }
                case 'offer':
                  handleOffer(data.offer)
                  break
                case 'answer':
                  handleAnswer(data.answer)
                  break
                case 'ice-candidate':
                  handleIceCandidate(data.candidate)
                  break
                case 'call-ended':
                  endCall()
                  break
              }
           }
          })

          // Send join call message
          client.publish({
            destination: '/app/join-call',
            body: JSON.stringify({ type: 'join-call', conversationId })
          })
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame)
        },
        onWebSocketError: (error) => {
          console.error('WebSocket error:', error)
        }
      })

      client.activate()
      setStompClient(client)

    } catch (error) {
      console.error('Error initializing call:', error)
      setCallStatus('Connection failed')
    }
  }

  const setupWebRTC = (stream: MediaStream, client: Client) => {
    // Create peer connection
    const pc = new RTCPeerConnection(WEBRTC_CONFIG)
    // Store the peer connection reference using useRef (with type assertion for compatibility)
    pcRef.current = pc as RTCPeerConnection

    // Add local stream to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.addEventListener('track', (event) => {
      // Handle remote stream
      console.log('Received remote stream')
      setRemoteStream(event.streams[0])
      setCallStatus('Connected')
    });
    
    pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate')
        client.publish({
          destination: '/app/ice-candidate',
          body: JSON.stringify({
            type: 'ice-candidate',
            conversationId,
            candidate: event.candidate,
          })
        })
      }
    });

    
  }

  const handleOffer = async (offer: any) => {
    if (!pcRef.current) return
    
    try {
      console.log('Received offer')
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pcRef.current.createAnswer()
      await pcRef.current.setLocalDescription(answer)
      
      if (stompClient) {
        stompClient.publish({
          destination: '/app/answer',
          body: JSON.stringify({
            type: 'answer',
            conversationId,
            answer: answer,
          })
        })
      }
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleAnswer = async (answer: any) => {
    if (!pcRef.current) return
    
    try {
      console.log('Received answer')
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const handleIceCandidate = async (candidate: any) => {
    if (!pcRef.current) return
    
    try {
      console.log('Received ICE candidate')
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error('Error adding ICE candidate:', error)
    }
  }

  const createOffer = async (pc: RTCPeerConnection, client?: Client) => {
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      const clientToUse = client || stompClient
      if (clientToUse) {
        clientToUse.publish({
          destination: '/app/offer',
          body: JSON.stringify({
            type: 'offer',
            conversationId,
            offer: offer,
          })
        })
      }
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  const cleanup = () => {
    console.log('Cleaning up WebRTC resources')
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (pcRef.current) {
      pcRef.current.close()
    }
    if (stompClient) {
      stompClient.deactivate()
    }
  }

  // 通话计时器
  useEffect(() => {
    let timer: number
    if (callStatus === 'Connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [callStatus])

  // 格式化通话时长
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 结束通话
  const endCall = () => {
    if (stompClient) {
      stompClient.publish({
        destination: '/app/end-call',
        body: JSON.stringify({ type: 'end-call',conversationId })
      })
    }
    cleanup()
    navigation.goBack()
  }

  // 切换静音
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted
      })
      setIsMuted(prev => !prev)
    }
  }

  // 切换摄像头
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn
      })
      setIsVideoOn(prev => !prev)
    }
  }

  // 切换扬声器
  const toggleSpeaker = () => {
    setIsSpeakerOn(prev => !prev)
    // TODO: Implement actual speaker toggle with native module
  }

  // 切换摄像头前后
  const switchCamera = async () => {
    try {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop())
        
        const newStream = await mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            frameRate: 30,
            facingMode: isVideoOn ? 'environment' : 'user',
          },
          audio: true,
        })
        
        setLocalStream(newStream)
        
        if (pcRef.current) {
          // Replace track in peer connection
          const videoTrack = newStream.getVideoTracks()[0]
          const sender = (pcRef.current as any).getSenders().find((s: any) => 
            s.track && s.track.kind === 'video'
          )
          if (sender && sender.replaceTrack) {
            await sender.replaceTrack(videoTrack)
          }
        }
      }
    } catch (error) {
      console.error('Error switching camera:', error)
    }
  }

  // 切换到语音通话
  const switchToVoiceCall = () => {
    setIsVideoOn(false)
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = false
      })
    }
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
        {remoteStream && isVideoOn ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={$remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={$videoOffContainer}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face" }}
              style={$avatarLarge}
              defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
            />
            <Text style={$videoOffText}>
              {remoteStream ? "Camera is off" : "Connecting..."}
            </Text>
          </View>
        )}
        
        {/* 通话信息覆盖层 */}
        <View style={$callInfoOverlay}>
          <Text style={$contactNameLarge}>{contactName}</Text>
          <Text style={$callDurationText}>{formatCallDuration(callDuration)}</Text>
          <Text style={$callStatusText}>{callStatus}</Text>
        </View>
      </View>

      {/* 本地视频区域 - 用户自己 */}
      <View style={$localVideoContainer}>
        {localStream && isVideoOn ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={$localVideo}
            objectFit="cover"
            mirror={true}
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

          {/* 切换摄像头按钮 */}
          <Pressable
            style={[$controlButton, $controlButtonInactive]}
            onPress={switchCamera}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Switch camera"
          >
            <Text style={[$controlButtonIcon, $controlButtonIconInactive]}>
              🔄
            </Text>
            <Text style={[$controlButtonText, $controlButtonTextInactive]}>
              Flip
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
