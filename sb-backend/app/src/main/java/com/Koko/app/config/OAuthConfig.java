package com.Koko.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "oauth")
public class OAuthConfig {
    private String clientId;
    private String clientSecret;
    private String authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    private String tokenUrl = "https://oauth2.googleapis.com/token";
    private String redirectUrl;
    private String tokenSecret;
    private int tokenExpiration = 36000;

    // Getters and Setters
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

    public String getAuthUrl() { return authUrl; }
    public void setAuthUrl(String authUrl) { this.authUrl = authUrl; }

    public String getTokenUrl() { return tokenUrl; }
    public void setTokenUrl(String tokenUrl) { this.tokenUrl = tokenUrl; }

    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }

    public String getTokenSecret() { return tokenSecret; }
    public void setTokenSecret(String tokenSecret) { this.tokenSecret = tokenSecret; }

    public int getTokenExpiration() { return tokenExpiration; }
    public void setTokenExpiration(int tokenExpiration) { this.tokenExpiration = tokenExpiration; }
}