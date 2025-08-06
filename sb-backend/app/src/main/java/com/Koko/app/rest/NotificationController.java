package com.Koko.app.rest;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Koko.app.service.JwtService;
import com.Koko.app.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JwtService jwtService;

    /**
     * Register FCM token for push notifications
     * POST /api/notifications/register-token
     * Body: { "fcmToken": "token", "platform": "android|ios|web" }
     * Cookie: JWT token
     */
    @PostMapping("/register-token")
    public ResponseEntity<Map<String, Object>> registerToken(
            @RequestBody Map<String, String> request,
            @CookieValue(value = "token", required = false) String token) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate JWT token
            if (token == null || token.isEmpty()) {
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            if (userInfo == null) {
                response.put("success", false);
                response.put("message", "Invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String email = (String) userInfo.get("email");

            // Validate request
            String fcmToken = request.get("fcmToken");
            String platform = request.get("platform");
            
            if (fcmToken == null || fcmToken.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "FCM token is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (platform == null || platform.trim().isEmpty()) {
                platform = "unknown"; // Default platform
            }

            // Register the token
            notificationService.registerUserToken(email, fcmToken.trim(), platform.trim());

            response.put("success", true);
            response.put("message", "FCM token registered successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to register FCM token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Remove FCM token (logout)
     * POST /api/notifications/remove-token
     * Cookie: JWT token
     */
    @PostMapping("/remove-token")
    public ResponseEntity<Map<String, Object>> removeToken(
            @CookieValue(value = "token", required = false) String token) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate JWT token
            if (token == null || token.isEmpty()) {
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            if (userInfo == null) {
                response.put("success", false);
                response.put("message", "Invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String email = (String) userInfo.get("email");

            // Remove the token
            notificationService.removeUserToken(email);

            response.put("success", true);
            response.put("message", "FCM token removed successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to remove FCM token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Send test notification
     * POST /api/notifications/test
     * Body: { "title": "Test", "body": "Test message" }
     * Cookie: JWT token
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTestNotification(
            @RequestBody Map<String, String> request,
            @CookieValue(value = "token", required = false) String token) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate JWT token
            if (token == null || token.isEmpty()) {
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            if (userInfo == null) {
                response.put("success", false);
                response.put("message", "Invalid token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String email = (String) userInfo.get("email");

            String title = request.getOrDefault("title", "Test Notification");
            String body = request.getOrDefault("body", "This is a test notification");

            // Send notification asynchronously
            notificationService.sendNotificationToUserByEmail(email, title, body)
                .thenAccept(messageId -> {
                    System.out.println("Test notification sent with ID: " + messageId);
                })
                .exceptionally(throwable -> {
                    System.err.println("Failed to send test notification: " + throwable.getMessage());
                    return null;
                });

            response.put("success", true);
            response.put("message", "Test notification sent");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send test notification: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/send-call")
    public ResponseEntity<Map<String, Object>> sendCallNotification(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String recipientUserId = request.get("recipientUserId");
            String callerName = request.get("callerName");
            String callerAvatar = request.get("callerAvatar");
            String conversationId = request.get("conversationId");

            notificationService.sendCallNotification(recipientUserId, callerName, callerAvatar, conversationId);
            
            response.put("success", true);
            response.put("message", "Call notification sent");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send call notification: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
