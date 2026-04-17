package com.example.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.demo.security.JwtFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    // ✅ Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ✅ Security rules (FIXED)
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // 🔥 IMPORTANT: ADMIN only access
.requestMatchers("/admin/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.GET, "/courses").hasAnyRole("ADMIN", "STUDENT")
.requestMatchers(HttpMethod.GET, "/courses/**").hasAnyRole("ADMIN", "STUDENT")
.requestMatchers(HttpMethod.GET, "/course/**").hasAnyRole("ADMIN", "STUDENT")
.requestMatchers(HttpMethod.GET, "/lesson/**").hasAnyRole("ADMIN", "STUDENT")
.requestMatchers(HttpMethod.POST, "/courses").hasRole("ADMIN")
.requestMatchers(HttpMethod.POST, "/courses/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.PUT, "/courses").hasRole("ADMIN")
.requestMatchers(HttpMethod.PUT, "/courses/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.DELETE, "/courses").hasRole("ADMIN")
.requestMatchers(HttpMethod.DELETE, "/courses/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.POST, "/students").hasRole("ADMIN")
.requestMatchers(HttpMethod.POST, "/students/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.PUT, "/students/**").hasRole("ADMIN")
.requestMatchers(HttpMethod.DELETE, "/students/**").hasRole("ADMIN")
.requestMatchers("/student/**").hasRole("STUDENT")
                // 🔐 everything else secured
                .anyRequest().authenticated()
            )

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        // ✅ JWT filter
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ✅ Authentication Manager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}