import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

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
        extension: '.m4a',
        outputFormat: 2, // MPEG_4
        audioEncoder: 3, // AAC
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        },
        ios: {
            extension: '.caf',
            audioQuality: 96, // HIGH
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
        },
        web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
        },
      });

      setRecording(recording);
      console.log('VoiceRecorder: Recording started successfully');
    } catch (error) {
      console.error('VoiceRecorder: Error starting recording:', error);
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

    const formData = new FormData();
    formData.append('audio', {
      uri,
      name: 'voice.wav',
      type: 'audio/wav',
    } as any);
    formData.append('conversationId', conversationId);
    
    console.log('VoiceRecorder: Sending audio to server...');
    try {
      const response = await axios.post('http://10.0.2.2:8080/api/messages/send', formData, {
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
      // Optionally call onTranscription with an error message or handle the error
    }
  };

  return <View />; // No UI needed — recording is controlled externally
});

export default VoiceRecorder;