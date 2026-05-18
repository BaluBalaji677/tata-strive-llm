package com.example.demo.security;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private static final long ACCESS_TOKEN_EXPIRATION = 15 * 60 * 1000L;
    private static final long REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000L;
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";
    private static final String TOKEN_TYPE_CLAIM = "tokenType";
    private static final String ROLE_CLAIM = "role";

    private final String SECRET = "bXlfc3VwZXJfc2VjcmV0X2tleV8xMjM0NTY3ODkwMTIzNDU2";
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String generateToken(String username) {
        return generateAccessToken(username);
    }

    public String generateAccessToken(String username) {
        return buildToken(username, null, ACCESS_TOKEN_EXPIRATION, ACCESS_TOKEN_TYPE);
    }

    public String generateAccessToken(String username, String role) {
        return buildToken(username, role, ACCESS_TOKEN_EXPIRATION, ACCESS_TOKEN_TYPE);
    }

    public String generateRefreshToken(String username) {
        return buildToken(username, null, REFRESH_TOKEN_EXPIRATION, REFRESH_TOKEN_TYPE);
    }

    public String generateRefreshToken(String username, String role) {
        return buildToken(username, role, REFRESH_TOKEN_EXPIRATION, REFRESH_TOKEN_TYPE);
    }

    public String extractUsername(String token) {
        Claims claims = getClaims(token);
        return claims != null ? claims.getSubject() : null;
    }

    public String extractRole(String token) {
        Claims claims = getClaims(token);
        return claims != null ? claims.get(ROLE_CLAIM, String.class) : null;
    }

    public boolean validateAccessToken(String token, String username) {
        return validateToken(token, username, ACCESS_TOKEN_TYPE);
    }

    public boolean validateRefreshToken(String token, String username) {
        return validateToken(token, username, REFRESH_TOKEN_TYPE);
    }

    private boolean validateToken(String token, String username, String tokenType) {
        Claims claims = getClaims(token);
        if (claims == null) {
            return false;
        }
        String subject = claims.getSubject();
        String actualType = claims.get(TOKEN_TYPE_CLAIM, String.class);
        return username != null
                && username.equals(subject)
                && tokenType.equals(actualType)
                && !isExpired(claims);
    }

    private boolean isExpired(Claims claims) {
        return claims.getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            return null;
        }
    }

    private String buildToken(String username, String role, long expirationMillis, String tokenType) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_TYPE_CLAIM, tokenType);
        if (role != null && !role.isBlank()) {
            claims.put(ROLE_CLAIM, role);
        }

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
