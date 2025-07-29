import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;

export type VoiceRecorderRef = {
  start: () => void;
  stop: () => void;
};

type VoiceRecorderProps = {
  conversationId: string;
  onTranscription?: (text: string, audioUri?: string) => void;
};

const VoiceRecorder = forwardRef<VoiceRecorderRef, VoiceRecorderProps>(({ conversationId, onTranscription }, ref) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useImperativeHandle(ref, () => ({
    start: () => startRecording(),
    stop: () => stopRecording(),
  }));

  const requestPermission = async () => {
    try {
      console.log('VoiceRecorder: Requesting audio permissions...');
      const { status, granted } = await Audio.requestPermissionsAsync();
      console.log('VoiceRecorder: Permission status:', status, 'granted:', granted);
      
      if (status === 'granted') {
        return true;
      } else {
        console.log('VoiceRecorder: Permission denied. Status:', status);
        // Show user-friendly message
        if (onTranscription) {
          onTranscription("Audio permission denied. Please enable microphone access in your device settings.");
        }
        return false;
      }
    } catch (error) {
      console.error('VoiceRecorder: Error requesting permissions:', error);
      if (onTranscription) {
        onTranscription("Error requesting microphone permission. Please try again.");
      }
      return false;
    }
  };

  const startRecording = async () => {
    console.log('VoiceRecorder: Starting recording...');
    const granted = await requestPermission();
    if (!granted) {
      console.log('VoiceRecorder: Audio permission not granted');
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
      console.log('VoiceRecorder: Recording started successfully');
    } catch (error) {
      console.error('VoiceRecorder: Error starting recording:', error);
      setRecording(null); // Ensure recording state is cleared
      // Notify parent that recording failed to start
      if (onTranscription) {
        onTranscription("Error starting recording. Please try again.");
      }
    }
  };

  const stopRecording = async () => {
    console.log('VoiceRecorder: stopRecording called');
    if (!recording) {
      console.log('VoiceRecorder: No recording to stop');
      return;
    }

    console.log('VoiceRecorder: Stopping and unloading recording...');
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    console.log('VoiceRecorder: Recording stopped, URI:', uri);

    // Don't call onRecordingStop here - wait until after upload/transcription is complete

    const formData = new FormData();
    formData.append('audio', {
      uri,
      name: 'voice.wav',
      type: 'audio/wav',
    } as any);
    formData.append('conversationId', conversationId);
    
    console.log('VoiceRecorder: Sending audio to server...');
    try {
      const response = await axios.post(`${serverUrl}/api/messages/send`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      const data = response.data;
      console.log('VoiceRecorder: Server response:', data);
      if (onTranscription) {
        console.log('VoiceRecorder: Calling onTranscription with:', data.text || data.transcription, 'and audioUri:', uri);
        onTranscription(data.text || data.transcription, uri || undefined);
      }
    } catch (error) {
      console.error('VoiceRecorder: Error sending voice message:', error);
      // Always call onTranscription to notify parent that recording is complete, even on error
      if (onTranscription) {
        onTranscription("Failed to send voice message. Please try again.");
      }
    }
  };

  return <View />; // No UI needed — recording is controlled externally
});

export default VoiceRecorder;