package com.Koko.app.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain authSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/auth/**")
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests((authorize) -> authorize
                        .anyRequest().permitAll()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(
                    org.springframework.security.config.http.SessionCreationPolicy.STATELESS
                ));
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests((authorize) -> authorize
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(Customizer.withDefaults())
                        .bearerTokenResolver(bearerTokenResolver())
                )
                .sessionManagement(session -> session.sessionCreationPolicy(
                    org.springframework.security.config.http.SessionCreationPolicy.STATELESS
                ));
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return JwtDecoders.fromIssuerLocation("https://accounts.google.com");
    }

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return new BearerTokenResolver() {
            private final DefaultBearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();
            
            @Override
            public String resolve(HttpServletRequest request) {
                // First try to get token from Authorization header
                String token = defaultResolver.resolve(request);
                
                // If not found, try to get from cookie
                if (token == null && request.getCookies() != null) {
                    for (Cookie cookie : request.getCookies()) {
                        if ("token".equals(cookie.getName())) {
                            return cookie.getValue();
                        }
                    }
                }
                
                return token;
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000", "http://localhost:8080")); //TODO: update backend url
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "content-type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}