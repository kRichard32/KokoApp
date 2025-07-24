// app/screens/ChatDetailScreen.tsx
import { FC, useState, useEffect, useRef } from "react"
import {
  View,
  Pressable,
  TextInput,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
  FlatList,
  ListRenderItem,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import axios from "axios"
import { Audio } from 'expo-av'

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import VoiceRecorder, { VoiceRecorderRef } from "@/components/VoiceRecorder"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const serverUrl = "http://10.0.2.2:8080"

// 消息数据类型
interface ChatMessage {
  id: string
  text?: string
  audioUrl?: string
  audioFileId?: string // 新增：音频文件ID
  audioDuration?: number // 语音时长（秒）
  timestamp: Date
  isFromUser: boolean
  isRead?: boolean
  messageType: 'text' | 'voice'
  transcription?: string // 语音转文字结果
}

interface Contact {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  specialty?: string
}

interface ChatDetailScreenProps extends AppStackScreenProps<"ChatDetail"> {}

export const ChatDetailScreen: FC<ChatDetailScreenProps> = ({ navigation, route }) => {
  const {
    themed,
    theme: { colors, spacing },
  } = useAppTheme()

  // 从路由参数获取联系人信息
  const { conversationId, conversationName } = route.params

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [contact, setContact] = useState<Contact | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isStartingRecording, setIsStartingRecording] = useState(false) // Prevent rapid clicks
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [audioObjects, setAudioObjects] = useState<{[key: string]: Audio.Sound}>({})
  const [audioLoadingStates, setAudioLoadingStates] = useState<{[key: string]: boolean}>({})
  const [showTranscription, setShowTranscription] = useState<{[key: string]: boolean}>({})
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice') // 输入模式切换
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null) // 追踪最新消息时间戳
  const flatListRef = useRef<FlatList>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const voiceRecorderRef = useRef<VoiceRecorderRef>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null) // 轮询计时器

  // 模拟数据加载
  useEffect(() => {
    loadChatData()
    startPolling() // 开始轮询新消息
    
    // 清理函数
    return () => {
      stopPolling()
    }
  }, [conversationId])

  // 清理音频对象
  useEffect(() => {
    // 设置音频模式
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: 2, // Do not mix
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1, // Do not mix
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    };
    
    setupAudio();
    
    return () => {
      // 组件卸载时清理所有音频对象
      Object.values(audioObjects).forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error('Error unloading audio:', error);
        }
      });
      
      // 清理轮询计时器
      stopPolling();
    };
  }, [audioObjects])

  // 预留的API接口函数
  const loadChatData = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/messages/getConversation`, {
        params: { conversationId },
        withCredentials: true,
      });
      
      const conversationData = response.data;
      const currentUser = conversationData.currentUser;
      const conversation = conversationData.conversation;
      console.log('Conversation data:', conversationData)
      // 设置联系人信息
      if (conversation) {
        const apiContact: Contact = {
          id: conversation.id,
          name: conversationName, // 使用从 MessageScreen 传递的名称
          avatar: require("../../assets/images/avatar-placeholder.jpg"),
          isOnline: true,
          specialty: "Doctor", // 可以从 API 获取
        }
        setContact(apiContact);
      }
      
      // 将 API 响应转换为消息格式
      if (conversation && conversation.messages) {
        const formattedMessages = conversation.messages.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.audioTranscription || msg.content, // 使用转录文本或内容
          audioFileId: msg.audioFileId, // 添加音频文件ID
          timestamp: new Date(msg.timestamp),
          isFromUser: msg.sender.id === currentUser,
          isRead: true, // 假设已读状态
          messageType: msg.audioFileId ? 'voice' : 'text', // 根据是否有音频文件确定类型
          transcription: msg.audioTranscription, // 语音转录文本
        }));
        
        setMessages(formattedMessages);
        
        // 更新最新消息时间戳
        if (formattedMessages.length > 0) {
          const latestMessage = formattedMessages[formattedMessages.length - 1];
          setLastMessageTimestamp(latestMessage.timestamp.toISOString());
        }
      }
      
    } catch (error) {
      console.error("Error loading conversation data:", error);
      
      // 如果 API 调用失败，使用模拟数据作为回退
      const mockContact: Contact = {
        id: conversationId,
        name: conversationName,
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
        isOnline: true,
        specialty: "Cardiologist",
      }

      const mockMessages: ChatMessage[] = [
        {
          id: "1",
          text: "Hello! How can I help you today?",
          timestamp: new Date(Date.now() - 3600000),
          isFromUser: false,
          isRead: true,
          messageType: 'text',
        },
        {
          id: "2",
          text: "I've been having some health concerns and would like to discuss them.",
          timestamp: new Date(Date.now() - 3500000),
          isFromUser: true,
          isRead: true,
          messageType: 'text',
        },
      ]

      setContact(mockContact)
      setMessages(mockMessages)
    }
  }

  // 轮询新消息函数
  const checkForNewMessages = async () => {
    // 如果正在录音，跳过此次轮询以避免干扰
    if (isRecording) {
      console.log('Skipping polling while recording...');
      return;
    }
    
    try {
      console.log('Polling for new messages...');
      const response = await axios.get(`${serverUrl}/api/messages/getConversation`, {
        params: { 
          conversationId, // 只获取此时间戳之后的消息
        },
        withCredentials: true,
      });
      
      const conversationData = response.data;
      const currentUser = conversationData.currentUser;
      const conversation = conversationData.conversation;
      
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        console.log(`Found ${conversation.messages.length} new messages`);
        
        // 转换新消息格式
        const newMessages = conversation.messages.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.audioTranscription || msg.content,
          audioFileId: msg.audioFileId,
          timestamp: new Date(msg.timestamp),
          isFromUser: msg.sender.id === currentUser,
          isRead: true,
          messageType: msg.audioFileId ? 'voice' : 'text',
          transcription: msg.audioTranscription,
        }));
        
        // 添加新消息到现有消息列表
        setMessages(prev => {
          // 避免重复消息
          const existingIds = new Set(prev.map(msg => msg.id));
          const uniqueNewMessages = newMessages.filter((msg: ChatMessage) => !existingIds.has(msg.id));
          
          if (uniqueNewMessages.length > 0) {
            console.log(`Adding ${uniqueNewMessages.length} unique new messages`);
            // 自动滚动到底部显示新消息
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
            
            return [...prev, ...uniqueNewMessages];
          }
          return prev;
        });
        
        // 更新最新消息时间戳
        if (newMessages.length > 0) {
          const latestMessage = newMessages[newMessages.length - 1];
          setLastMessageTimestamp(latestMessage.timestamp.toISOString());
        }
      }
    } catch (error) {
      console.error('Error polling for new messages:', error);
      // 静默失败，不影响用户体验
    }
  };

  // 开始轮询
  const startPolling = () => {
    console.log('Starting message polling...');
    // 每3秒检查一次新消息
    pollingIntervalRef.current = setInterval(checkForNewMessages, 3000);
  };

  // 停止轮询
  const stopPolling = () => {
    console.log('Stopping message polling...');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // API接口函数 - 发送文本消息
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      timestamp: new Date(),
      isFromUser: true,
      isRead: false,
      messageType: 'text',
    }

    // 添加用户消息
    setMessages(prev => [...prev, newMessage])
    setInputText("")

    try {
      // 暂停轮询以避免冲突
      stopPolling();
      
      // 发送到后端API
      console.log('Sending text message:', messageText.trim())
      const response = await axios.post(`${serverUrl}/api/messages/sendText`, {
        conversationId: conversationId,
        audioTranscription: messageText.trim(),
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Text message sent successfully:', response.data);

      // 重新加载聊天数据以获取最新的消息
      setTimeout(() => {
        loadChatData().then(() => {
          // 重新开始轮询
          startPolling();
        });
      }, 500);

    } catch (error) {
      console.error('Error sending text message:', error);
      
      // 即使出错也要重新开始轮询
      setTimeout(() => {
        startPolling();
      }, 1000);
      
      // 如果发送失败，显示错误消息（可选）
      // 这里可以添加错误处理逻辑，比如显示重试按钮
    }

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  // 语音录制功能
  const startRecording = async () => {
    // 防止在已有录音进行时开始新录音
    if (isRecording || isStartingRecording) {
      console.log('ChatDetailScreen: Recording already in progress or starting, ignoring start request');
      return;
    }
    
    // 防止多重点击 - 额外检查是否已有计时器在运行
    if (recordingTimerRef.current) {
      console.log('ChatDetailScreen: Timer already running, ignoring start request');
      return;
    }
    
    console.log('ChatDetailScreen: Starting recording...');
    setIsStartingRecording(true); // 设置开始标志
    
    try {
      setIsRecording(true)
      setRecordingDuration(0)
      
      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

      // 使用 VoiceRecorder 组件开始录音
      voiceRecorderRef.current?.start()
      
    } catch (error) {
      console.error('ChatDetailScreen: Error starting recording:', error);
      // 如果出错，重置状态
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    } finally {
      setIsStartingRecording(false); // 清除开始标志
    }
  }

  const stopRecording = async () => {
    console.log('ChatDetailScreen: Stopping recording...');
    
    // 防止重复停止
    if (!isRecording) {
      console.log('ChatDetailScreen: No recording to stop');
      return;
    }
    
    setIsRecording(false)
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    // 使用 VoiceRecorder 组件停止录音
    voiceRecorderRef.current?.stop()
    
    setRecordingDuration(0)
  }

  // 处理语音转文字结果
  const handleTranscription = (transcription: string, audioUri?: string) => {
    console.log('ChatDetailScreen: Received transcription:', transcription);
    const messageId = Date.now().toString();
    const voiceMessage: ChatMessage = {
      id: messageId,
      text: transcription, // 使用转录文本作为消息内容
      timestamp: new Date(),
      isFromUser: true,
      isRead: false,
      messageType: 'voice', // 标记为语音消息
      transcription: transcription, // 保存转录文本
      audioFileId: messageId, // 使用消息ID作为临时audioFileId
    }

    setMessages(prev => [...prev, voiceMessage])

    // 如果有本地音频URI，直接创建音频对象供播放
    if (audioUri) {
      console.log('Storing local audio for immediate playback:', audioUri);
      Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      ).then(({ sound }) => {
        // 存储音频对象
        setAudioObjects(prev => ({ ...prev, [messageId]: sound }));
        
        // 设置播放完成回调
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingMessageId(null);
          }
        });
        
        console.log('Local audio ready for playback');
      }).catch((error) => {
        console.error('Error creating local audio object:', error);
      });
    }

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    // 不再自动重新加载聊天数据，让用户可以立即播放本地音频
    // setTimeout(() => {
    //   loadChatData()
    // }, 1000)
  }

  // 获取并播放音频消息
  const fetchAndPlayAudio = async (messageId: string) => {
    try {
      setAudioLoadingStates(prev => ({ ...prev, [messageId]: true }));
      
      console.log('Fetching audio for message:', messageId);
      
      // 获取音频数据
      const response = await axios.get(`${serverUrl}/api/messages/getMessageAudio`, {
        params: { messageId },
        responseType: 'arraybuffer',
        withCredentials: true,
      });
      
      // 将字节数组转换为Base64
      const audioData = response.data;
      const base64Audio = btoa(
        new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // 创建音频URI
      const audioUri = `data:audio/mp4;base64,${base64Audio}`;
      
      // 创建并加载音频对象
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      // 存储音频对象
      setAudioObjects(prev => ({ ...prev, [messageId]: sound }));
      
      // 设置播放完成回调
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMessageId(null);
        }
      });
      
      setAudioLoadingStates(prev => ({ ...prev, [messageId]: false }));
      
      // 开始播放
      await sound.playAsync();
      setPlayingMessageId(messageId);
      
    } catch (error) {
      console.error('Error fetching/playing audio:', error);
      setAudioLoadingStates(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // 播放语音
  const toggleVoicePlayback = async (messageId: string, audioFileId?: string) => {
    console.log('toggleVoicePlayback called:', { messageId, audioFileId, playingMessageId });
    
    try {
      if (playingMessageId === messageId) {
        // 停止播放
        console.log('Stopping audio for message:', messageId);
        const audioObject = audioObjects[messageId];
        if (audioObject) {
          try {
            const status = await audioObject.getStatusAsync();
            if (status.isLoaded) {
              await audioObject.stopAsync();
            }
          } catch (stopError) {
            console.warn('Error stopping audio:', stopError);
          }
        }
        setPlayingMessageId(null);
      } else {
        // 停止其他正在播放的音频
        if (playingMessageId && audioObjects[playingMessageId]) {
          console.log('Stopping previous audio:', playingMessageId);
          try {
            const status = await audioObjects[playingMessageId].getStatusAsync();
            if (status.isLoaded) {
              await audioObjects[playingMessageId].stopAsync();
            }
          } catch (stopError) {
            console.warn('Error stopping previous audio:', stopError);
          }
        }
        
        // 开始播放新音频
        if (audioFileId) {
          console.log('Starting audio playback for:', messageId);
          if (audioObjects[messageId]) {
            // 检查音频是否已正确加载
            try {
              const status = await audioObjects[messageId].getStatusAsync();
              if (status.isLoaded) {
                console.log('Audio already loaded, replaying...');
                await audioObjects[messageId].replayAsync();
                setPlayingMessageId(messageId);
              } else {
                console.log('Audio object exists but not loaded, fetching again...');
                await fetchAndPlayAudio(messageId);
              }
            } catch (statusError) {
              console.log('Error checking audio status, fetching again...');
              await fetchAndPlayAudio(messageId);
            }
          } else {
            // 如果音频未加载，先获取再播放
            console.log('Audio not loaded, fetching...');
            await fetchAndPlayAudio(messageId);
          }
        } else {
          console.warn('No audioFileId provided for message:', messageId);
        }
      }
    } catch (error) {
      console.error('Error in toggleVoicePlayback:', error);
      setPlayingMessageId(null);
      setAudioLoadingStates(prev => ({ ...prev, [messageId]: false }));
    }
  }

  // 视频/语音通话功能
  const startVideoCall = () => {
    // 导航到视频通话界面
    navigation.navigate('VideoCall', { conversationId, conversationName })
  }

  const startVoiceCall = () => {
    // TODO: 启动语音通话功能
    console.log('Starting voice call with', contact?.name)
    // 可以导航到语音通话界面或直接在此界面启动语音通话
  }

  // 切换转文字显示
  const toggleTranscription = (messageId: string) => {
    setShowTranscription(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  // 格式化录音时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const renderMessage: ListRenderItem<ChatMessage> = ({ item }) => (
    <View style={[ 
      $messageContainer, 
      item.isFromUser ? $userMessageContainer : $doctorMessageContainer 
    ]}> 
      {!item.isFromUser && ( 
        <Image 
          source={
            contact?.avatar && typeof contact.avatar === 'string'
              ? { uri: contact.avatar }
              : require("../../assets/images/avatar-placeholder.jpg")
          }
          style={$messageAvatar} 
          defaultSource={require("../../assets/images/avatar-placeholder.jpg")} 
        /> 
      )} 
      <View style={[ 
        $messageBubble, 
        item.isFromUser ? $userMessageBubble : $doctorMessageBubble 
      ]}>
        {item.messageType === 'voice' ? (
          // 语音消息
          <View style={$voiceMessageContainer}>
            <Pressable
              style={[$playButton, !item.audioFileId && $disabledButton]}
              onPress={() => toggleVoicePlayback(item.id, item.audioFileId)}
              disabled={!item.audioFileId || audioLoadingStates[item.id]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={playingMessageId === item.id ? "Stop voice message" : "Play voice message"}
            >
              <Text style={[
                $playButtonText,
                item.isFromUser ? $userPlayButtonText : $doctorPlayButtonText
              ]}>
                {!item.audioFileId ? "❌" : (audioLoadingStates[item.id] ? "⏳" : (playingMessageId === item.id ? "⏸️" : "▶️"))}
              </Text>
            </Pressable>
            
            <View style={$voiceInfo}>
              <View style={$waveformContainer}>
                {/* 简单的波形可视化 */}
                {Array.from({ length: 8 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      $waveformBar,
                      item.isFromUser ? $userWaveformBar : $doctorWaveformBar,
                      playingMessageId === item.id && $activeWaveformBar
                    ]}
                  />
                ))}
              </View>
              <Text style={[
                $voiceDuration,
                item.isFromUser ? $userVoiceDuration : $doctorVoiceDuration
              ]}>
                {formatDuration(item.audioDuration || 0)}
              </Text>
            </View>

            {/* 转文字按钮 */}
            <Pressable
              style={$transcriptionButton}
              onPress={() => toggleTranscription(item.id)}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Toggle transcription"
            >
              <Text style={[
                $transcriptionButtonText,
                item.isFromUser ? $userTranscriptionButtonText : $doctorTranscriptionButtonText
              ]}>
                Aa
              </Text>
            </Pressable>
          </View>
        ) : (
          // 文字消息
          <Text style={[
            $messageText,
            item.isFromUser ? $userMessageText : $doctorMessageText
          ]}>
            {item.text}
          </Text>
        )}

        {/* 显示转文字结果 */}
        {item.messageType === 'voice' && showTranscription[item.id] && item.transcription && (
          <View style={$transcriptionContainer}>
            <Text style={[
              $transcriptionText,
              item.isFromUser ? $userTranscriptionText : $doctorTranscriptionText
            ]}>
              "{item.transcription}"
            </Text>
          </View>
        )}

        <Text style={[
          $messageTime,
          item.isFromUser ? $userMessageTime : $doctorMessageTime
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  )

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($container)}
    >
      {/* Header */}
      <View style={$header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={$backButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back to messages"
        >
          <Text style={$backIcon}>←</Text>
        </Pressable>
        
        <View style={$contactHeader}>
          <Image
            source={
              contact?.avatar && typeof contact.avatar === 'string'
                ? { uri: contact.avatar }
                : require("../../assets/images/avatar-placeholder.jpg")
            }
            style={$headerAvatar}
            defaultSource={require("../../assets/images/avatar-placeholder.jpg")}
          />
          <View style={$contactInfo}>
            <Text style={$conversationName}>{contact?.name}</Text>
            {contact?.isOnline && (
              <Text style={$onlineStatus}>● Online</Text>
            )}
          </View>
        </View>

        <Pressable
          style={$videoCallButton}
          onPress={startVideoCall}
          onLongPress={startVoiceCall}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Start video call with ${contact?.name}. Long press for voice call`}
          accessibilityHint="Tap for video call, long press for voice call"
        >
          <Text style={$videoCallIcon}>📹</Text>
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={$messagesList}
        contentContainerStyle={$messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area - 大麦克风设计 */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={$inputArea}
      >
        {inputMode === 'text' ? (
          // 文字输入模式
          <View style={$inputContainer}>
            <TextInput
              style={$textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              accessible
              accessibilityLabel="Message input"
            />
            <Pressable
              style={$sendButton}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Send text message"
            >
              <Text style={$sendButtonText}>Send</Text>
            </Pressable>
          </View>
        ) : (
          // 语音输入模式 - 大麦克风
          <View style={$voiceInputContainer}>
            {isRecording && (
              <View style={$recordingIndicator}>
                <View style={$recordingDot} />
                <Text style={$recordingTime}>{formatDuration(recordingDuration)}</Text>
              </View>
            )}
            
            <Pressable
              style={[
                $largeMicButton,
                isRecording ? $largeMicButtonRecording : $largeMicButtonIdle
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isStartingRecording} // 禁用按钮防止快速点击
              accessible
              accessibilityRole="button"
              accessibilityLabel={isRecording ? "Stop recording voice message" : "Start recording voice message"}
            >
              <Text style={$largeMicIcon}>
                {isRecording ? "🔴" : "🎤"}
              </Text>
            </Pressable>

            {/* 录音提示 */}
            {isRecording ? (
              <Text style={$recordingHintText}>🔴 Recording... Press again to send</Text>
            ) : (
              <Text style={$micHintText}>Press to start recording voice message</Text>
            )}
          </View>
        )}

        {/* 模式切换按钮 - 右下角 */}
        <Pressable
          style={$modeToggleButton}
          onPress={() => setInputMode(prev => prev === 'voice' ? 'text' : 'voice')}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${inputMode === 'voice' ? 'text' : 'voice'} input mode`}
        >
          <Text style={$modeToggleIcon}>
            {inputMode === 'voice' ? '💬' : '🎤'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
      
      {/* VoiceRecorder Component */}
      <VoiceRecorder
        ref={voiceRecorderRef}
        conversationId={conversationId}
        onTranscription={handleTranscription}
      />
    </Screen>
  )
}

/* ————————— 样式 ————————— */

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "#FFFFFF",
})

const $header: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#F0F0F0",
  backgroundColor: "#FFFFFF",
}

const $backButton: ViewStyle = {
  padding: 8,
  marginRight: 8,
}

const $backIcon: TextStyle = {
  fontSize: 24,
  color: "#666",
}

const $contactHeader: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
}

const $headerAvatar: ImageStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 12,
  backgroundColor: "#F0F0F0",
}

const $contactInfo: ViewStyle = {
  flex: 1,
}

const $conversationName: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#000",
  marginBottom: 2,
}

const $onlineStatus: TextStyle = {
  fontSize: 12,
  color: "#34C759",
  fontWeight: "500",
}

const $videoCallButton: ViewStyle = {
  padding: 12,
  marginLeft: 8,
  backgroundColor: "#34C759",
  borderRadius: 22,
  minWidth: 44,
  minHeight: 44,
  alignItems: "center",
  justifyContent: "center",
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
}

const $videoCallIcon: TextStyle = {
  fontSize: 20,
}

const $messagesList: ViewStyle = {
  flex: 1,
}

const $messagesContainer: ViewStyle = {
  paddingVertical: 16,
  paddingHorizontal: 16,
}

const $messageContainer: ViewStyle = {
  flexDirection: "row",
  marginBottom: 16,
  alignItems: "flex-end",
}

const $userMessageContainer: ViewStyle = {
  justifyContent: "flex-end",
  paddingLeft: 60,
}

const $doctorMessageContainer: ViewStyle = {
  justifyContent: "flex-start",
  paddingRight: 60,
}

const $messageAvatar: ImageStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  marginRight: 8,
  backgroundColor: "#F0F0F0",
}

const $messageBubble: ViewStyle = {
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 12,
  maxWidth: "80%",
}

const $userMessageBubble: ViewStyle = {
  backgroundColor: "#007AFF",
  marginLeft: "auto",
}

const $doctorMessageBubble: ViewStyle = {
  backgroundColor: "#F0F0F0",
}

const $messageText: TextStyle = {
  fontSize: 16,
  lineHeight: 22,
  marginBottom: 4,
}

const $userMessageText: TextStyle = {
  color: "#FFFFFF",
}

const $doctorMessageText: TextStyle = {
  color: "#000000",
}

const $messageTime: TextStyle = {
  fontSize: 12,
  opacity: 0.7,
}

const $userMessageTime: TextStyle = {
  color: "#FFFFFF",
  textAlign: "right",
}

const $doctorMessageTime: TextStyle = {
  color: "#666666",
}

const $inputArea: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderTopWidth: 1,
  borderTopColor: "#F0F0F0",
  position: "relative",
}

const $inputContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-end",
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 12,
}

// 语音输入容器样式
const $voiceInputContainer: ViewStyle = {
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 32,
  minHeight: 160,
  justifyContent: "center",
}

// 大麦克风按钮样式
const $largeMicButton: ViewStyle = {
  width: 100,
  height: 100,
  borderRadius: 50,
  justifyContent: "center",
  alignItems: "center",
  elevation: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  marginBottom: 20,
  zIndex: 10,
}

const $largeMicButtonIdle: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $largeMicButtonRecording: ViewStyle = {
  backgroundColor: "#FF3B30",
}

const $largeMicIcon: TextStyle = {
  fontSize: 40,
  textAlign: "center",
  lineHeight: 50,
}

const $micHintText: TextStyle = {
  fontSize: 16,
  color: "#666",
  textAlign: "center",
  fontWeight: "500",
}

// 模式切换按钮样式
const $modeToggleButton: ViewStyle = {
  position: "absolute",
  right: 20,
  bottom: 20,
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: "#F0F0F0",
  justifyContent: "center",
  alignItems: "center",
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 5,
  zIndex: 5,
}

const $modeToggleIcon: TextStyle = {
  fontSize: 24,
}

const $textInput: TextStyle = {
  flex: 1,
  borderWidth: 1,
  borderColor: "#E0E0E0",
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  maxHeight: 100,
  color: "#000",
  backgroundColor: "#F8F8F8",
  marginRight: 8,
}

const $voiceButtonContainer: ViewStyle = {
  alignItems: "center",
  position: "relative",
}

const $recordingIndicator: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 24,
  paddingHorizontal: 16,
  paddingVertical: 8,
  backgroundColor: "#FF3B30",
  borderRadius: 20,
  elevation: 3,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
}

const $recordingDot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#FFFFFF",
  marginRight: 6,
}

const $recordingTime: TextStyle = {
  fontSize: 14,
  color: "#FFFFFF",
  fontWeight: "600",
}

const $voiceButton: ViewStyle = {
  width: 60,
  height: 60,
  borderRadius: 30,
  justifyContent: "center",
  alignItems: "center",
  elevation: 3,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
}

const $voiceButtonIdle: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $voiceButtonRecording: ViewStyle = {
  backgroundColor: "#FF3B30",
}

const $voiceButtonText: TextStyle = {
  fontSize: 24,
}

const $sendButton: ViewStyle = {
  borderRadius: 20,
  paddingHorizontal: 20,
  paddingVertical: 12,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#007AFF",
  marginLeft: 8,
}

const $sendButtonText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#FFFFFF",
}

const $recordingHint: ViewStyle = {
  alignItems: "center",
  paddingVertical: 8,
}

const $recordingHintText: TextStyle = {
  fontSize: 14,
  color: "#FF3B30",
  fontWeight: "500",
}

// 语音消息相关样式
const $voiceMessageContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  minWidth: 200,
}

const $playButton: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 8,
}

const $disabledButton: ViewStyle = {
  opacity: 0.5,
}

const $playButtonText: TextStyle = {
  fontSize: 18,
}

const $userPlayButtonText: TextStyle = {
  color: "#FFFFFF",
}

const $doctorPlayButtonText: TextStyle = {
  color: "#007AFF",
}

const $voiceInfo: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $waveformContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
  marginRight: 8,
}

const $waveformBar: ViewStyle = {
  width: 3,
  backgroundColor: "#C0C0C0",
  marginRight: 2,
  borderRadius: 1.5,
}

const $userWaveformBar: ViewStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  height: Math.random() * 20 + 10, // 随机高度模拟波形
}

const $doctorWaveformBar: ViewStyle = {
  backgroundColor: "#C0C0C0",
  height: Math.random() * 20 + 10,
}

const $activeWaveformBar: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $voiceDuration: TextStyle = {
  fontSize: 12,
  fontWeight: "500",
}

const $userVoiceDuration: TextStyle = {
  color: "rgba(255, 255, 255, 0.8)",
}

const $doctorVoiceDuration: TextStyle = {
  color: "#666",
}

const $transcriptionButton: ViewStyle = {
  padding: 4,
  borderRadius: 12,
  marginLeft: 8,
}

const $transcriptionButtonText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
}

const $userTranscriptionButtonText: TextStyle = {
  color: "rgba(255, 255, 255, 0.8)",
}

const $doctorTranscriptionButtonText: TextStyle = {
  color: "#007AFF",
}

const $transcriptionContainer: ViewStyle = {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: "rgba(255, 255, 255, 0.2)",
}

const $transcriptionText: TextStyle = {
  fontSize: 14,
  fontStyle: "italic",
}

const $userTranscriptionText: TextStyle = {
  color: "rgba(255, 255, 255, 0.9)",
}

const $doctorTranscriptionText: TextStyle = {
  color: "#666",
}
