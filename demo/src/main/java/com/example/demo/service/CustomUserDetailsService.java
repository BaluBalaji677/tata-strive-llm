package com.example.demo.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.entity.Role;
import com.example.demo.entity.Student;
import com.example.demo.entity.User;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final UserRepository userRepo;
    private final StudentRepository studentRepository;

    public CustomUserDetailsService(UserRepository userRepo, StudentRepository studentRepository) {
        this.userRepo = userRepo;
        this.studentRepository = studentRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String subject) throws UsernameNotFoundException {
        log.debug("Loading user details for subject={}", subject);

        if (subject == null || subject.isBlank()) {
            throw new UsernameNotFoundException("JWT subject is missing");
        }

        Student student = studentRepository.findByRollNumber(subject).orElse(null);
        if (student != null) {
            User user = student.getUser();
            if (user == null) {
                throw new UsernameNotFoundException("User not linked to student");
            }

            return new org.springframework.security.core.userdetails.User(
                    student.getRollNumber(),
                    user.getPasswordHash(),
                    List.of(new SimpleGrantedAuthority(toAuthority(user)))
            );
        }

        User user = userRepo.findByUsername(subject)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority(toAuthority(user)))
        );
    }

    private String toAuthority(User user) {
        Role role = user.getRole();
        if (role == null) {
            throw new UsernameNotFoundException("User role is missing for username: " + user.getUsername());
        }
        return "ROLE_" + role.name();
    }
}
