package com.Koko.app.service;

import com.Koko.app.config.OAuthConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.HashMap;
import java.security.interfaces.RSAPublicKey;
import java.security.KeyFactory;
import java.security.spec.RSAPublicKeySpec;
import java.math.BigInteger;

@Service
public class JwtService {

    @Autowired
    private OAuthConfig config;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    
    // Cache for Google's public keys
    private Map<String, RSAPublicKey> googlePublicKeys = new HashMap<>();
    private long keysLastUpdated = 0;
    private static final long KEYS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
            // Clean the token - remove "Bearer " prefix if present
            String cleanToken = cleanBearerToken(idToken);
            
            // Validate and decode the Google ID token with signature verification
            return validateGoogleIdToken(cleanToken);
        } catch (Exception e) {
            throw new RuntimeException("Failed to validate and decode ID token", e);
        }
    }
    
    /**
     * Remove "Bearer " prefix from token if present
     * @param token The raw token that might have Bearer prefix
     * @return Clean token without Bearer prefix
     */
    private String cleanBearerToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Token cannot be null or empty");
        }
        
        String cleanToken = token.trim();
        if (cleanToken.toLowerCase().startsWith("bearer ")) {
            cleanToken = cleanToken.substring(7); // Remove "Bearer " prefix
        }
        
        return cleanToken;
    }
    
    /**
     * Validate Google ID token with signature verification
     * This prevents tampering by validating against Google's public keys
     * @param idToken The Google ID token to validate
     * @return Map containing validated user information
     */
    private Map<String, Object> validateGoogleIdToken(String idToken) throws Exception {
        // Split the token into header, payload, and signature
        String[] tokenParts = idToken.split("\\.");
        if (tokenParts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT token format");
        }
        
        // Decode header to get the key ID
        String headerJson = new String(Base64.getUrlDecoder().decode(tokenParts[0]));
        JsonNode header = objectMapper.readTree(headerJson);
        String keyId = header.get("kid").asText();
        String algorithm = header.get("alg").asText();
        
        if (!"RS256".equals(algorithm)) {
            throw new IllegalArgumentException("Unsupported algorithm: " + algorithm);
        }
        
        // Get Google's public key for verification
        RSAPublicKey publicKey = getGooglePublicKey(keyId);
        
        // Verify the token signature and extract claims
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(idToken)
                .getBody();
        
        // Validate issuer (must be from Google)
        String issuer = claims.getIssuer();
        if (!"https://accounts.google.com".equals(issuer) && !"accounts.google.com".equals(issuer)) {
            throw new IllegalArgumentException("Invalid issuer: " + issuer);
        }
        
        // Validate audience (must be your Google Client ID)
        String audience = claims.getAudience();
        if (!config.getClientId().equals(audience)) {
            throw new IllegalArgumentException("Invalid audience: " + audience);
        }
        
        // Validate expiration
        Date expiration = claims.getExpiration();
        if (expiration.before(new Date())) {
            throw new IllegalArgumentException("Token has expired");
        }
        
        // Extract user information from validated claims
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", claims.get("email"));
        userInfo.put("name", claims.get("name"));
        userInfo.put("picture", claims.get("picture"));
        userInfo.put("sub", claims.getSubject()); // Google user ID
        userInfo.put("email_verified", claims.get("email_verified"));
        
        return userInfo;
    }
    
    /**
     * Get Google's public key for token verification
     * @param keyId The key ID from the token header
     * @return RSA public key for verification
     */
    private RSAPublicKey getGooglePublicKey(String keyId) throws Exception {
        // Check if we need to refresh the keys
        long currentTime = System.currentTimeMillis();
        if (googlePublicKeys.isEmpty() || (currentTime - keysLastUpdated) > KEYS_CACHE_DURATION) {
            refreshGooglePublicKeys();
        }
        
        RSAPublicKey publicKey = googlePublicKeys.get(keyId);
        if (publicKey == null) {
            // Try refreshing keys once more if key not found
            refreshGooglePublicKeys();
            publicKey = googlePublicKeys.get(keyId);
            
            if (publicKey == null) {
                throw new IllegalArgumentException("Public key not found for key ID: " + keyId);
            }
        }
        
        return publicKey;
    }
    
    /**
     * Refresh Google's public keys from their JWKs endpoint
     * This fetches the latest keys to verify token signatures
     */
    private void refreshGooglePublicKeys() throws Exception {
        String jwksUrl = "https://www.googleapis.com/oauth2/v3/certs";
        
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(jwksUrl, Map.class);
        
        if (response == null || !response.containsKey("keys")) {
            throw new RuntimeException("Failed to fetch Google public keys");
        }
        
        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> keys = (java.util.List<Map<String, Object>>) response.get("keys");
        
        Map<String, RSAPublicKey> newKeys = new HashMap<>();
        
        for (Map<String, Object> key : keys) {
            String keyId = (String) key.get("kid");
            String keyType = (String) key.get("kty");
            String use = (String) key.get("use");
            
            // Only process RSA keys for signature verification
            if ("RSA".equals(keyType) && "sig".equals(use)) {
                String nStr = (String) key.get("n");
                String eStr = (String) key.get("e");
                
                // Decode the modulus and exponent
                byte[] nBytes = Base64.getUrlDecoder().decode(nStr);
                byte[] eBytes = Base64.getUrlDecoder().decode(eStr);
                
                BigInteger modulus = new BigInteger(1, nBytes);
                BigInteger exponent = new BigInteger(1, eBytes);
                
                // Create the RSA public key
                RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
                KeyFactory factory = KeyFactory.getInstance("RSA");
                RSAPublicKey publicKey = (RSAPublicKey) factory.generatePublic(spec);
                
                newKeys.put(keyId, publicKey);
            }
        }
        
        this.googlePublicKeys = newKeys;
        this.keysLastUpdated = System.currentTimeMillis();
    }
}