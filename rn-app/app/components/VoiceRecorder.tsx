import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View } from 'react-native';
import { Audio } from 'expo-av';

export type VoiceRecorderRef = {
  start: () => void;
  stop: () => void;
};

type VoiceRecorderProps = {
  onTranscription?: (text: string) => void;
};

const VoiceRecorder = forwardRef<VoiceRecorderRef, VoiceRecorderProps>(({ onTranscription }, ref) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useImperativeHandle(ref, () => ({
    start: () => startRecording(),
    stop: () => stopRecording(),
  }));

  const requestPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  };

  const startRecording = async () => {
    const granted = await requestPermission();
    if (!granted) return;

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
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    const formData = new FormData();
    formData.append('audio', {
      uri,
      name: 'voice.wav',
      type: 'audio/wav',
    } as any);
    

    //add backend IP
    const res = await fetch('http://<YOUR_IP>:8080/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await res.json();
    if (onTranscription) {
      onTranscription(data.text);
    }
  };

  return <View />; // No UI needed — recording is controlled externally
});

export default VoiceRecorder;