package com.Koko.app.rest;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.Koko.app.config.OAuthConfig;
import com.Koko.app.service.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "${app.client.url}", allowCredentials = "true")
public class AuthController {

    @Autowired
    private OAuthConfig config;

    @Autowired
    private JwtService jwtService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/url")
    public ResponseEntity<Map<String, String>> getAuthUrl() {
        try {
            String authParams = String.format(
                    "client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&state=standard_oauth&prompt=consent",
                    URLEncoder.encode(config.getClientId(), StandardCharsets.UTF_8),
                    URLEncoder.encode(config.getRedirectUrl(), StandardCharsets.UTF_8),
                    URLEncoder.encode("openid profile email", StandardCharsets.UTF_8)
            );

            String authUrl = config.getAuthUrl() + "?" + authParams;

            Map<String, String> response = new HashMap<>();
            response.put("url", authUrl);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/token")
    public ResponseEntity<?> exchangeToken(
            @RequestParam String code,
            HttpServletResponse response) {

        if (code == null || code.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Authorization code must be provided");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            // Prepare token exchange parameters as form data
            MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
            tokenParams.add("client_id", config.getClientId());
            tokenParams.add("client_secret", config.getClientSecret());
            tokenParams.add("code", code);
            tokenParams.add("grant_type", "authorization_code");
            tokenParams.add("redirect_uri", config.getRedirectUrl());

            // Set headers for form data
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // Create request entity
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(tokenParams, headers);

            // Exchange authorization code for tokens
            String tokenResponse = restTemplate.postForObject(config.getTokenUrl(), requestEntity, String.class);

            if (tokenResponse == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Auth error");
                return ResponseEntity.badRequest().body(error);
            }

            // Parse response to get id_token
            JsonNode tokenJson = objectMapper.readTree(tokenResponse);
            String idToken = tokenJson.has("id_token") ? tokenJson.get("id_token").asText() : null;

            if (idToken == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Auth error");
                return ResponseEntity.badRequest().body(error);
            }

            // Decode id_token to get user info (Note: This doesn't verify signature)
            Map<String, Object> userInfo = jwtService.decodeIdToken(idToken);

            Map<String, Object> user = new HashMap<>();
            user.put("name", userInfo.get("name"));
            user.put("email", userInfo.get("email"));
            user.put("picture", userInfo.get("picture"));

            // Send Google's id_token (JWT) to frontend for API authentication
            // Set Google's id_token as cookie
            Cookie cookie = new Cookie("token", idToken);
            cookie.setMaxAge(config.getTokenExpiration());
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            response.addCookie(cookie);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("user", user);
            responseBody.put("idToken", idToken); // Send id_token to frontend

            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage() != null ? e.getMessage() : "Server error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/logged_in")
    public ResponseEntity<Map<String, Object>> checkLoginStatus(
            @CookieValue(value = "token", required = false) String token,
            HttpServletResponse response) {

        Map<String, Object> responseBody = new HashMap<>();

        try {
            if (token == null || token.isEmpty()) {
                responseBody.put("loggedIn", false);
                return ResponseEntity.ok(responseBody);
            }

            // Validate Google id_token by decoding it (Google's JWT)
            try {
                Map<String, Object> userInfo = jwtService.decodeIdToken(token);
                
                Map<String, Object> user = new HashMap<>();
                user.put("name", userInfo.get("name"));
                user.put("email", userInfo.get("email"));
                user.put("picture", userInfo.get("picture"));

                responseBody.put("loggedIn", true);
                responseBody.put("user", user);
            } catch (Exception e) {
                // Token is invalid or expired
                responseBody.put("loggedIn", false);
            }

            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            responseBody.put("loggedIn", false);
            return ResponseEntity.ok(responseBody);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        // Clear cookie
        Cookie cookie = new Cookie("token", "");
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        response.addCookie(cookie);

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("message", "Logged out");

        return ResponseEntity.ok(responseBody);
    }
}