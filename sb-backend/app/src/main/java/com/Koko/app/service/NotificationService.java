package com.Koko.app.service;

import com.google.firebase.messaging.*;
import com.Koko.app.domain.Profile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

@Service
public class NotificationService {

    @Autowired
    private ProfileService profileService;

    public void sendCallNotification(String recipientUserId, String callerName, String callerAvatar, String conversationId) {
        try {
            // Get user's FCM token from database
            String fcmToken = getUserFCMToken(recipientUserId);

            if (fcmToken != null) {
                Map<String, String> data = new HashMap<>();
                data.put("type", "incoming_call");
                data.put("callerName", callerName);
                data.put("callerAvatar", callerAvatar);
                data.put("conversationId", conversationId);

                Message message = Message.builder()
                        .setToken(fcmToken)
                        .putAllData(data)
                        .setAndroidConfig(AndroidConfig.builder()
                                .setPriority(AndroidConfig.Priority.HIGH)
                                .setNotification(AndroidNotification.builder()
                                        .setTitle("Incoming call from " + callerName)
                                        .setBody("Tap to answer")
                                        .setSound("call-ring.wav")
                                        .setPriority(AndroidNotification.Priority.MAX)
                                        .build())
                                .build())
                        .setApnsConfig(ApnsConfig.builder()
                                .setAps(Aps.builder()
                                        .setAlert(ApsAlert.builder()
                                                .setTitle("Incoming call from " + callerName)
                                                .setBody("Tap to answer")
                                                .build())
                                        .setSound("call-ring.wav")
                                        .build())
                                .build())
                        .build();

                FirebaseMessaging.getInstance().send(message);
                System.out.println("Call notification sent to: " + recipientUserId);
            }
        } catch (Exception e) {
            System.err.println("Error sending call notification: " + e.getMessage());
        }
    }

    public void registerUserToken(String email, String fcmToken, String platform) {
        try {
            // Update the user's FCM token in the database
            profileService.updateFcmTokenByEmail(email, fcmToken, platform);
            System.out.println("FCM token registered for user: " + email);
        } catch (Exception e) {
            System.err.println("Failed to register FCM token for user: " + email + " - " + e.getMessage());
            throw new RuntimeException("Failed to register FCM token for user: " + email, e);
        }
    }

    public CompletableFuture<String> sendNotificationToUser(long profileId, String title, String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Get the user's profile with FCM token
                Profile profile = profileService.getProfile(profileId);
                
                if (profile.getFcmToken() == null || profile.getFcmToken().isEmpty()) {
                    throw new RuntimeException("User does not have an FCM token registered");
                }

                // Build the notification message
                Message message = Message.builder()
                    .setToken(profile.getFcmToken())
                    .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                    .putData("click_action", "FLUTTER_NOTIFICATION_CLICK")
                    .build();

                // Send the message
                String response = FirebaseMessaging.getInstance().send(message);
                System.out.println("Notification sent to profile ID: " + profileId);
                return response;
                
            } catch (Exception e) {
                System.err.println("Failed to send notification to profile ID: " + profileId + " - " + e.getMessage());
                throw new CompletionException("Failed to send notification", e);
            }
        });
    }

    public CompletableFuture<String> sendNotificationToUserByEmail(String email, String title, String body) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Get the user's profile with FCM token
                Profile profile = profileService.getProfileByEmail(email);
                
                if (profile == null) {
                    throw new RuntimeException("User not found with email: " + email);
                }
                
                if (profile.getFcmToken() == null || profile.getFcmToken().isEmpty()) {
                    throw new RuntimeException("User does not have an FCM token registered");
                }

                // Build the notification message
                Message message = Message.builder()
                    .setToken(profile.getFcmToken())
                    .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                    .putData("click_action", "FLUTTER_NOTIFICATION_CLICK")
                    .build();

                // Send the message
                String response = FirebaseMessaging.getInstance().send(message);
                System.out.println("Notification sent to user email: " + email);
                return response;
                
            } catch (Exception e) {
                System.err.println("Failed to send notification to user email: " + email + " - " + e.getMessage());
                throw new CompletionException("Failed to send notification", e);
            }
        });
    }

    public void removeUserToken(String email) {
        try {
            Profile profile = profileService.getProfileByEmail(email);
            if (profile != null) {
                profileService.clearFcmToken(profile.getId());
                System.out.println("FCM token removed for user: " + email);
            }
        } catch (Exception e) {
            System.err.println("Failed to remove FCM token for user: " + email + " - " + e.getMessage());
            throw new RuntimeException("Failed to remove FCM token for user: " + email, e);
        }
    }

    private String getUserFCMToken(String userId) {
        try {
            // Try to parse userId as profile ID first
            long profileId = Long.parseLong(userId);
            Profile profile = profileService.getProfile(profileId);
            return profile.getFcmToken();
        } catch (NumberFormatException e) {
            // If not a number, try as email
            Profile profile = profileService.getProfileByEmail(userId);
            return profile != null ? profile.getFcmToken() : null;
        } catch (Exception e) {
            System.err.println("Error retrieving FCM token for user: " + userId + " - " + e.getMessage());
            return null;
        }
    }
}