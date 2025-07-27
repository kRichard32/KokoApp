package com.Koko.app.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.speech.v1.RecognitionAudio;
import com.google.cloud.speech.v1.RecognitionConfig;
import com.google.cloud.speech.v1.RecognizeResponse;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.SpeechRecognitionResult;
import com.google.cloud.speech.v1.SpeechSettings;
import com.google.protobuf.ByteString;

@Service
public class TranscriptionService {
    
    @Value("${google.cloud.speech.credentials.json:}")
    private String credentialsJson;
    
    public String transcribe(byte[] audioBytes) throws IOException {
        SpeechClient speechClient;
        
        if (credentialsJson != null && !credentialsJson.isEmpty()) {
            // Use custom credentials from environment variable
            GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ByteArrayInputStream(credentialsJson.getBytes()));
            
            SpeechSettings settings = SpeechSettings.newBuilder()
                .setCredentialsProvider(() -> credentials)
                .build();
            
            speechClient = SpeechClient.create(settings);
        } else {
            // Use default Application Default Credentials
            speechClient = SpeechClient.create();
        }
        
        try (speechClient) {
            RecognitionConfig config = RecognitionConfig.newBuilder()
                .setEncoding(RecognitionConfig.AudioEncoding.WEBM_OPUS) // Better for web audio
                .setSampleRateHertz(16000) // Standard sample rate
                .setLanguageCode("en-US")
                .build();

            RecognitionAudio audio = RecognitionAudio.newBuilder()
                .setContent(ByteString.copyFrom(audioBytes))
                .build();

            RecognizeResponse response = speechClient.recognize(config, audio);
            StringBuilder transcript = new StringBuilder();
            for (SpeechRecognitionResult result : response.getResultsList()) {
                if (result.getAlternativesCount() > 0) {
                    transcript.append(result.getAlternatives(0).getTranscript());
                }
            }
            return transcript.toString().trim();
        }
    }
}