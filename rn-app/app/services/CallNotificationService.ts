// app/services/CallNotificationService.ts
import messaging from '@react-native-firebase/messaging'
import { Platform, PermissionsAndroid, Alert } from 'react-native'
import axios from 'axios'
import { navigate } from '../navigators/navigationUtilities'

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

export class CallNotificationService {
  static onAnswerCallback: ((conversationId: string) => void) | null = null
  static onRejectCallback: ((conversationId: string) => void) | null = null

  // Helper function to get user profile ID
  static getUserProfileId = async (): Promise<string> => {
    const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL
    const response = await axios.get(`${serverUrl}/api/profile/getUserProfile`, {
      withCredentials: true,
    })
    console.log('getUserProfileId response:', response.data.id)
    return response.data.id
  }

  static async initialize() {
    try {
      // Request permissions for notifications
      if (Platform.OS === 'android') {
        // For Android 13+ (API level 33+), we need to request POST_NOTIFICATIONS permission
        try {
          console.log('Requesting Android notification permissions...');
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs access to show notifications for incoming calls',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          console.log('Android notification permission result:', granted);
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Android notification permissions not granted, result:', granted);
            // Continue anyway as some Android versions don't require explicit permission
          } else {
            console.log('Android notification permissions granted');
          }
        } catch (error) {
          console.error('Error requesting Android notification permissions:', error);
          // Continue anyway as permission might not be needed on older Android versions
        }
      }

      // Request Firebase messaging permissions
      console.log('Requesting Firebase messaging permissions...');
      const authStatus = await messaging().requestPermission();
      console.log('Firebase messaging permission status:', authStatus);
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('Firebase messaging permissions not granted, status:', authStatus);
        return;
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);

      // Set up message handlers
      this.setupMessageHandlers();

      console.log('Call notification service initialized');

      // Set up the answer callback to get user profile and navigate
      CallNotificationService.onAnswerCallback = async (conversationId: string) => {
        try {
          console.log('Answering call for conversation:', conversationId)
          const userId = await CallNotificationService.getUserProfileId()
          navigate("VideoCall", {
            conversationId: conversationId,
            userId: userId,
            isInitiator: false
          })
        } catch (error) {
          console.error('Error getting user profile for call answer:', error)
          // Fallback navigation without user ID
          navigate("VideoCall", {
            conversationId: conversationId,
            userId: 'unknown',
            isInitiator: false
          })
        }
      }

      // Set up the reject callback
      CallNotificationService.onRejectCallback = (conversationId: string) => {
        console.log('Rejecting call for conversation:', conversationId)
        // Could send rejection message to backend here
      }
      
    } catch (error) {
      console.error('Error initializing call notification service:', error);
    }
  }

  static setupMessageHandlers() {
    // Handle background messages
     // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('Background message:', remoteMessage)
        
        if (remoteMessage.data?.type === 'incoming_call') {
          console.log('Incoming call notification received in background')
          // Background notifications will be handled by system taps
          // Custom actions require the user to tap the notification to open the app
        }
      })

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        console.log('Foreground message:', remoteMessage)
        
        if (remoteMessage.data?.type === 'incoming_call') {
          console.log('Incoming call notification received in foreground')
          
          // Show alert with Answer/Reject options when app is in foreground
          const callerName = remoteMessage.data.callerName || 'Unknown'
          const conversationId = String(remoteMessage.data.conversationId || '')
          
          Alert.alert(
            'Incoming Call',
            `Call from ${callerName}`,
            [
              {
                text: 'Reject',
                style: 'cancel',
                onPress: () => {
                  console.log('Call rejected')
                  if (CallNotificationService.onRejectCallback) {
                    CallNotificationService.onRejectCallback(conversationId)
                  }
                }
              },
              {
                text: 'Answer',
                onPress: () => {
                  console.log('Call answered')
                  if (CallNotificationService.onAnswerCallback) {
                    CallNotificationService.onAnswerCallback(conversationId)
                  }
                }
              }
            ],
            { cancelable: false }
          )
        }
      })

      // Handle notification tap when app is in background
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification caused app to open from background state:', remoteMessage)
        
        if (remoteMessage.data?.type === 'incoming_call') {
          const conversationId = String(remoteMessage.data.conversationId || '')
          const callerName = remoteMessage.data.callerName || 'Unknown'
          
          // Show answer/reject dialog when notification is tapped
          Alert.alert(
            'Incoming Call',
            `Call from ${callerName}`,
            [
              {
                text: 'Reject',
                style: 'cancel',
                onPress: () => {
                  if (CallNotificationService.onRejectCallback) {
                    CallNotificationService.onRejectCallback(conversationId)
                  }
                }
              },
              {
                text: 'Answer',
                onPress: () => {
                  if (CallNotificationService.onAnswerCallback) {
                    CallNotificationService.onAnswerCallback(conversationId)
                  }
                }
              }
            ],
            { cancelable: false }
          )
        }
      })

      // Check whether an initial notification is available (app opened from notification)
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('Notification caused app to open from quit state:', remoteMessage)
            
            if (remoteMessage.data?.type === 'incoming_call') {
              const conversationId = String(remoteMessage.data.conversationId || '')
              const callerName = remoteMessage.data.callerName || 'Unknown'
              
              // Show answer/reject dialog when app is opened via notification
              setTimeout(() => {
                Alert.alert(
                  'Incoming Call',
                  `Call from ${callerName}`,
                  [
                    {
                      text: 'Reject',
                      style: 'cancel',
                      onPress: () => {
                        if (CallNotificationService.onRejectCallback) {
                          CallNotificationService.onRejectCallback(conversationId)
                        }
                      }
                    },
                    {
                      text: 'Answer',
                      onPress: () => {
                        if (CallNotificationService.onAnswerCallback) {
                          CallNotificationService.onAnswerCallback(conversationId)
                        }
                      }
                    }
                  ],
                  { cancelable: false }
                )
              }, 1000) // Small delay to ensure app is fully loaded
            }
          }
        })

      console.log('Call notification service initialized with Firebase')
  }

  static async getTokenForTesting(): Promise<string | undefined> {
    try {
      const token = await messaging().getToken();
      console.log('=== FCM TOKEN FOR TESTING ===');
      console.log(token);
      console.log('=== END FCM TOKEN ===');
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return undefined;
    }
  }

  static async showIncomingCallNotification(callData: any) {
    try {
      const { callerName, callerAvatar, conversationId } = callData;

      // For incoming calls, we'll rely on Firebase push notifications
      // The actual notification display is handled by the Firebase backend
      console.log('Incoming call notification handled by Firebase for:', callerName);
      
    } catch (error) {
      console.error('Error handling incoming call notification:', error);
    }
  }

  static async sendCallNotification(recipientUserId: string, callerData: any) {
    try {
      console.log('Sending call notification to:', recipientUserId)
      
      const response = await axios.post(`${serverUrl}/api/notifications/send-call`, {
        recipientUserId,
        callerName: callerData.name,
        callerAvatar: callerData.avatar,
        conversationId: callerData.conversationId,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })

      console.log('Call notification sent successfully')
      
    } catch (error) {
      console.error('Error sending call notification:', error)
      // Don't throw error to prevent breaking the call flow
    }
  }

  static async sendDeclineNotification(conversationId: string) {
    try {
      const response = await axios.post(`${serverUrl}/api/calls/decline`, {
        conversationId,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })

      console.log('Call decline notification sent')
      
    } catch (error) {
      console.error('Error sending call decline notification:', error)
    }
  }
}
