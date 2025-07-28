package com.Koko.app.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.gax.longrunning.OperationFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.speech.v1.LongRunningRecognizeMetadata;
import com.google.cloud.speech.v1.LongRunningRecognizeResponse;
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
        SpeechClient speechClient = createSpeechClient();
        
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
    
    /**
     * Perform asynchronous transcription for longer audio files
     * This method uses Google Cloud Speech-to-Text long-running recognize operation
     * 
     * @param audioBytes The audio data as byte array
     * @return CompletableFuture containing the transcription result
     */
    public CompletableFuture<String> transcribeAsync(byte[] audioBytes) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                SpeechClient speechClient = createSpeechClient();
                
                try (speechClient) {
                    RecognitionConfig config = RecognitionConfig.newBuilder()
                        .setEncoding(RecognitionConfig.AudioEncoding.WEBM_OPUS)
                        .setSampleRateHertz(16000)
                        .setLanguageCode("en-US")
                        .setEnableAutomaticPunctuation(true) // Enable automatic punctuation for better readability
                        .setEnableWordTimeOffsets(true) // Enable word-level timestamps
                        .build();

                    RecognitionAudio audio = RecognitionAudio.newBuilder()
                        .setContent(ByteString.copyFrom(audioBytes))
                        .build();

                    // Use long-running recognize for async processing
                    OperationFuture<LongRunningRecognizeResponse, LongRunningRecognizeMetadata> operation =
                        speechClient.longRunningRecognizeAsync(config, audio);

                    // Wait for the operation to complete
                    LongRunningRecognizeResponse response = operation.get();
                    
                    StringBuilder transcript = new StringBuilder();
                    for (SpeechRecognitionResult result : response.getResultsList()) {
                        if (result.getAlternativesCount() > 0) {
                            transcript.append(result.getAlternatives(0).getTranscript());
                        }
                    }
                    return transcript.toString().trim();
                }
            } catch (IOException | InterruptedException | ExecutionException e) {
                throw new RuntimeException("Error during asynchronous transcription", e);
            }
        });
    }
    
    /**
     * Perform asynchronous transcription with progress callback
     * This method allows monitoring the progress of long-running transcription operations
     * 
     * @param audioBytes The audio data as byte array
     * @param progressCallback Callback function to report progress (0.0 to 1.0)
     * @return CompletableFuture containing the transcription result
     */
    public CompletableFuture<String> transcribeAsyncWithProgress(byte[] audioBytes, 
                                                               java.util.function.Consumer<Double> progressCallback) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                SpeechClient speechClient = createSpeechClient();
                
                try (speechClient) {
                    RecognitionConfig config = RecognitionConfig.newBuilder()
                        .setEncoding(RecognitionConfig.AudioEncoding.WEBM_OPUS)
                        .setSampleRateHertz(16000)
                        .setLanguageCode("en-US")
                        .setEnableAutomaticPunctuation(true)
                        .setEnableWordTimeOffsets(true)
                        .build();

                    RecognitionAudio audio = RecognitionAudio.newBuilder()
                        .setContent(ByteString.copyFrom(audioBytes))
                        .build();

                    // Start the long-running operation
                    OperationFuture<LongRunningRecognizeResponse, LongRunningRecognizeMetadata> operation =
                        speechClient.longRunningRecognizeAsync(config, audio);

                    // Monitor progress
                    progressCallback.accept(0.0); // Start
                    
                    // Poll for completion (simplified progress tracking)
                    int maxAttempts = 60; // Maximum wait time of 5 minutes (60 * 5 seconds)
                    int attempts = 0;
                    
                    while (!operation.isDone() && attempts < maxAttempts) {
                        try {
                            Thread.sleep(5000); // Wait 5 seconds between checks
                            attempts++;
                            double progress = Math.min(0.9, (double) attempts / maxAttempts);
                            progressCallback.accept(progress);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("Transcription interrupted", e);
                        }
                    }
                    
                    // Get the final result
                    LongRunningRecognizeResponse response = operation.get();
                    progressCallback.accept(1.0); // Complete
                    
                    StringBuilder transcript = new StringBuilder();
                    for (SpeechRecognitionResult result : response.getResultsList()) {
                        if (result.getAlternativesCount() > 0) {
                            transcript.append(result.getAlternatives(0).getTranscript());
                        }
                    }
                    return transcript.toString().trim();
                }
            } catch (IOException | InterruptedException | ExecutionException e) {
                throw new RuntimeException("Error during asynchronous transcription with progress", e);
            }
        });
    }
    
    /**
     * Create SpeechClient with appropriate credentials
     * 
     * @return Configured SpeechClient instance
     * @throws IOException if credentials cannot be loaded
     */
    private SpeechClient createSpeechClient() throws IOException {
        if (credentialsJson != null && !credentialsJson.isEmpty()) {
            // Use custom credentials from environment variable
            GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ByteArrayInputStream(credentialsJson.getBytes()));
            
            SpeechSettings settings = SpeechSettings.newBuilder()
                .setCredentialsProvider(() -> credentials)
                .build();
            
            return SpeechClient.create(settings);
        } else {
            // Use default Application Default Credentials
            return SpeechClient.create();
        }
    }
}