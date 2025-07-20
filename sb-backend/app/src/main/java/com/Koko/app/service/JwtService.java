package com.Koko.app.service;

import com.Koko.app.config.OAuthConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.HashMap;

@Service
public class JwtService {

    @Autowired
    private OAuthConfig config;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String createToken(Map<String, Object> user) {
        SecretKey key = Keys.hmacShaKeyFor(config.getTokenSecret().getBytes());

        return Jwts.builder()
                .claim("user", user)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + (config.getTokenExpiration() * 1000L)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Map<String, Object> verifyToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(config.getTokenSecret().getBytes());

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) claims.get("user");

            return user;
        } catch (Exception e) {
            return null;
        }
    }

    public Map<String, Object> decodeIdToken(String idToken) {
        try {
            // Split the token and decode the payload (Note: This doesn't verify signature)
            String[] chunks = idToken.split("\\.");
            String payload = new String(Base64.getUrlDecoder().decode(chunks[1]));

            JsonNode jsonNode = objectMapper.readTree(payload);

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("email", jsonNode.has("email") ? jsonNode.get("email").asText() : null);
            userInfo.put("name", jsonNode.has("name") ? jsonNode.get("name").asText() : null);
            userInfo.put("picture", jsonNode.has("picture") ? jsonNode.get("picture").asText() : null);

            return userInfo;
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode ID token", e);
        }
    }
}