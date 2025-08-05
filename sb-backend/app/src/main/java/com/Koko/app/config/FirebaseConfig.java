package com.Koko.app.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.json:}")
    private String credentialsJson;

    @Value("${firebase.project.id:}")
    private String projectId;

    @Bean
    public FirebaseMessaging firebaseMessaging() throws IOException {
        // Check if Firebase app is already initialized
        if (FirebaseApp.getApps().isEmpty()) {
            GoogleCredentials credentials;
            
            if (credentialsJson != null && !credentialsJson.isEmpty()) {
                // Use custom credentials from environment variable
                ByteArrayInputStream credentialsStream = new ByteArrayInputStream(credentialsJson.getBytes());
                credentials = GoogleCredentials.fromStream(credentialsStream);
            } else {
                // Fall back to Application Default Credentials
                credentials = GoogleCredentials.getApplicationDefault();
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .setProjectId(projectId)
                    .build();

            FirebaseApp.initializeApp(options);
        }
        
        return FirebaseMessaging.getInstance();
    }
}