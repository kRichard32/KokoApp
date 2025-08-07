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

// WebRTC Configuration - Testing with different public TURN servers
const WEBRTC_CONFIG = {
  iceServers: [
    // STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "593f89e4a575173796b40ebe",
        credential: "Z1mTOoUbVbCdPEYT",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "593f89e4a575173796b40ebe",
        credential: "Z1mTOoUbVbCdPEYT",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "593f89e4a575173796b40ebe",
        credential: "Z1mTOoUbVbCdPEYT",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "593f89e4a575173796b40ebe",
        credential: "Z1mTOoUbVbCdPEYT",
      },
    
    // Try these alternative TURN servers
    {
      urls: 'turn:turn.bistri.com:80',
      username: 'homeo',
      credential: 'homeo'
    },
    {
      urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
      username: 'webrtc',
      credential: 'webrtc'
    },
    {
      urls: 'turn:numb.viagenie.ca:3478',
      username: 'webrtc@live.com',
      credential: 'muazkh'
    },
    // Alternative working server
    {
      urls: 'turn:relay.backups.cz:3478',
      username: 'webrtc',
      credential: 'webrtc'
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all' as const,
  bundlePolicy: 'max-bundle' as const,
  rtcpMuxPolicy: 'require' as const
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
  // Buffer for ICE candidates that arrive before remote description is set
  const iceCandidateBuffer = useRef<any[]>([]);
  // Track candidate types
  const candidateStats = useRef({ host: 0, srflx: 0, relay: 0, prflx: 0 });

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
        webSocketFactory: () => new SockJS(sockjsUrl, null, { transports: ['websocket', 'xhr-streaming', 'xhr-polling'] }),
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
            
            if (data.senderId != userId){
              // console.log('Received STOMP message:', data)
              // console.log('client', userId)
              switch (data.type) {
                case "peer-joined":
                  // If initiator, create offer
                  if (isInitiator) {
                    console.log('Creating offer as initiator')
                    createOffer(pcRef.current as RTCPeerConnection, client)
                  }
                  break
                case 'offer':
                  handleOffer(data.payload.offer, client)
                  break
                case 'answer':
                  handleAnswer(data.payload.answer)
                  break
                case 'ice-candidate':
                  handleIceCandidate(data.payload.candidate)
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
    try {
      console.log('Setting up WebRTC with simplified configuration...')
      console.log('WebRTC Configuration:', WEBRTC_CONFIG)
      
      // Create peer connection with error handling
      const pc = new RTCPeerConnection(WEBRTC_CONFIG)
      // Store the peer connection reference using useRef (with type assertion for compatibility)
      pcRef.current = pc as RTCPeerConnection

      console.log('PeerConnection created successfully')
      console.log('Setting up WebRTC with local stream tracks:', stream.getTracks().length)
      console.log('Local video tracks:', stream.getVideoTracks().length)
      console.log('Local audio tracks:', stream.getAudioTracks().length)

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind)
        pc.addTrack(track, stream);
      });

      console.log('All tracks added successfully')

      pc.addEventListener('track', (event) => {
        // Handle remote stream
        console.log('Received remote stream')
        console.log('Remote stream tracks:', event.streams[0]?.getTracks().length)
        console.log('Remote stream video tracks:', event.streams[0]?.getVideoTracks().length)
        console.log('Remote stream audio tracks:', event.streams[0]?.getAudioTracks().length)
        
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0])
          setCallStatus('Connected')
        }
      });
      
      pc.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate')
          console.log('Candidate string:', event.candidate.candidate)
          
          // Parse candidate string to get type info and track stats
          const candidateStr = event.candidate.candidate
          if (candidateStr.includes('typ host')) {
            console.log('>>> HOST candidate (local network)')
            candidateStats.current.host++
          } else if (candidateStr.includes('typ srflx')) {
            console.log('>>> SRFLX candidate (STUN - public IP)')
            candidateStats.current.srflx++
          } else if (candidateStr.includes('typ relay')) {
            console.log('>>> RELAY candidate (TURN - relayed) 🎉')
            candidateStats.current.relay++
          } else if (candidateStr.includes('typ prflx')) {
            console.log('>>> PRFLX candidate (peer reflexive)')
            candidateStats.current.prflx++
          }
          
          client.publish({
            destination: '/app/ice-candidate',
            body: JSON.stringify({
              type: 'ice-candidate',
              conversationId,
              candidate: event.candidate,
            })
          })
        } else {
          console.log('ICE candidate gathering finished - all candidates sent')
          console.log('📊 CANDIDATE SUMMARY:', candidateStats.current)
          if (candidateStats.current.relay === 0) {
            console.error('⚠️ NO RELAY CANDIDATES - TURN servers not working!')
            console.log('💡 This explains why connection fails when SRFLX alone is insufficient')
          } else {
            console.log('✅ RELAY candidates available - TURN servers working')
          }
        }
      });

      pc.addEventListener('connectionstatechange', () => {
        console.log('Connection state changed:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          setCallStatus('Connected')
        } else if (pc.connectionState === 'disconnected') {
          setCallStatus('Disconnected')
        } else if (pc.connectionState === 'failed') {
          console.error('WebRTC connection failed')
          setCallStatus('Connection failed')
          // Optionally try to restart the connection
          setTimeout(() => {
            console.log('Attempting to restart ICE...')
            pc.restartIce()
          }, 2000)
        }
      });

      pc.addEventListener('iceconnectionstatechange', () => {
        console.log('ICE connection state changed:', pc.iceConnectionState)
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallStatus('Connected')
          console.log('🎉 ICE connection successful!')
        } else if (pc.iceConnectionState === 'disconnected') {
          setCallStatus('Reconnecting...')
        } else if (pc.iceConnectionState === 'failed') {
          console.error('ICE connection failed')
          console.log('📊 Final candidate stats:', candidateStats.current)
          if (candidateStats.current.relay === 0) {
            console.error('💔 Connection failed because NO RELAY candidates were generated')
            console.log('🔧 TURN servers are not reachable or credentials are invalid')
            console.log('🌐 Both peers are likely behind restrictive NATs requiring TURN relay')
          } else {
            console.error('💔 Connection failed despite having RELAY candidates')
            console.log('🔍 This suggests network-level connectivity issues')
          }
          setCallStatus('Connection failed')
          // Try to restart ICE
          setTimeout(() => {
            console.log('Attempting to restart ICE after failure...')
            if (pc.connectionState !== 'closed') {
              // Reset candidate stats for retry
              candidateStats.current = { host: 0, srflx: 0, relay: 0, prflx: 0 }
              pc.restartIce()
            }
          }, 3000)
        } else if (pc.iceConnectionState === 'checking') {
          setCallStatus('Connecting...')
          console.log('🔍 Checking ICE connectivity with gathered candidates...')
        }
      });

      pc.addEventListener('icegatheringstatechange', () => {
        console.log('ICE gathering state changed:', pc.iceGatheringState)
      });

      pc.addEventListener('negotiationneeded', () => {
        console.log('Negotiation needed')
      });

    } catch (error) {
      console.error('Failed to create PeerConnection:', error)
      setCallStatus('Connection setup failed')
      return
    }
  }

  const flushBufferedIceCandidates = async () => {
    console.log('Flushing buffered ICE candidates:', iceCandidateBuffer.current.length)
    const bufferedCandidates = [...iceCandidateBuffer.current]
    iceCandidateBuffer.current = []
    
    for (const candidate of bufferedCandidates) {
      try {
        if (pcRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          console.log('Buffered ICE candidate added successfully')
        }
      } catch (error) {
        console.error('Error adding buffered ICE candidate:', error)
      }
    }
  }

  const handleOffer = async (offer: any, client: Client) => {
    if (!pcRef.current) return
    
    try {
      console.log('Received offer')
      console.log('Current signaling state:', pcRef.current.signalingState)
      
      // Only process offer if we're in the correct state
      if (pcRef.current.signalingState !== 'stable') {
        console.warn('Ignoring offer - not in stable state, current state:', pcRef.current.signalingState)
        return
      }
      
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      console.log('Remote offer set successfully')
      
      // Flush any buffered ICE candidates after setting remote description
      await flushBufferedIceCandidates()
      
      const answer = await pcRef.current.createAnswer()
      await pcRef.current.setLocalDescription(answer)
      console.log('Local answer set successfully')
      
      if (client) {
        client.publish({
          destination: '/app/answer',
          body: JSON.stringify({
            type: 'answer',
            conversationId,
            answer: answer,
          })
        })
      }
      console.log('Sent answer')
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleAnswer = async (answer: any) => {
    if (!pcRef.current) return
    
    try {
      console.log('Received answer')
      console.log('Current signaling state:', pcRef.current.signalingState)
      
      // Only process answer if we're in the correct state
      if (pcRef.current.signalingState !== 'have-local-offer') {
        console.warn('Ignoring answer - not in have-local-offer state, current state:', pcRef.current.signalingState)
        return
      }
      
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
      console.log('Remote answer set successfully')
      
      // Flush any buffered ICE candidates after setting remote description
      await flushBufferedIceCandidates()
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const handleIceCandidate = async (candidate: any) => {
    if (!pcRef.current) return
    
    try {
      console.log('Received ICE candidate from remote peer')
      console.log('Remote candidate string:', candidate.candidate)
      
      // Parse remote candidate string to get type info
      const candidateStr = candidate.candidate
      if (candidateStr.includes('typ host')) {
        console.log('>>> Received HOST candidate from remote (local network)')
      } else if (candidateStr.includes('typ srflx')) {
        console.log('>>> Received SRFLX candidate from remote (STUN - public IP)')
      } else if (candidateStr.includes('typ relay')) {
        console.log('>>> Received RELAY candidate from remote (TURN - relayed)')
      } else if (candidateStr.includes('typ prflx')) {
        console.log('>>> Received PRFLX candidate from remote (peer reflexive)')
      }
      
      // Check if remote description is set before adding ICE candidate
      if (pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        console.log('ICE candidate added successfully')
      } else {
        // Buffer the candidate if remote description is not set yet
        console.log('Buffering ICE candidate - remote description not set')
        iceCandidateBuffer.current.push(candidate)
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error)
    }
  }

  const createOffer = async (pc: RTCPeerConnection, client?: Client) => {
  try {
    console.log('Creating offer, current signaling state:', pc.signalingState)
    
    if (pc.signalingState !== 'stable') {
      console.warn('Cannot create offer - not in stable state:', pc.signalingState)
      return
    }
    
    // Set offer options for better compatibility
    const offerOptions = {
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
      voiceActivityDetection: false
    }
    
    const offer = await pc.createOffer(offerOptions)
    await pc.setLocalDescription(offer)
    console.log('Local offer set successfully')
    
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
      console.log('Offer sent via STOMP')
    }
  } catch (error) {
    console.error('Error creating offer:', error)
  }
}

  const cleanup = () => {
    console.log('Cleaning up WebRTC resources')
    
    // Stop all local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    
    // Deactivate STOMP client
    if (stompClient) {
      stompClient.deactivate()
      setStompClient(null)
    }
    
    // Clear remote stream
    setRemoteStream(null)
    
    // Clear ICE candidate buffer
    iceCandidateBuffer.current = []
    
    // Reset candidate stats
    candidateStats.current = { host: 0, srflx: 0, relay: 0, prflx: 0 }
    
    // Reset UI states
    setCallStatus('Connecting...')
    setCallDuration(0)
    setIsMuted(false)
    setIsVideoOn(true)
    setIsSpeakerOn(true)
    setContactName('Contact')
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
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      // Handle case where there's nowhere to go back to
      navigation.navigate("Home")
      console.log('Already at root screen')
    }
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
        {remoteStream ? (
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
