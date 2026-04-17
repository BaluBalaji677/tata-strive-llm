package com.example.demo.service;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.entity.User;
import com.example.demo.entity.Student;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.StudentRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepo;
    private final StudentRepository studentRepository;

    public CustomUserDetailsService(UserRepository userRepo, StudentRepository studentRepository) {
        this.userRepo = userRepo;
        this.studentRepository = studentRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String subject) throws UsernameNotFoundException {

        System.out.println("🔥 AUTH CHECK (JWT SUBJECT): " + subject);

        // 1) Student flow: JWT subject is rollNumber
        Student student = studentRepository.findByRollNumber(subject).orElse(null);
        if (student != null) {
            User user = student.getUser();
            if (user == null) {
                throw new UsernameNotFoundException("User not linked to student");
            }

            return new org.springframework.security.core.userdetails.User(
                    student.getRollNumber(), // IMPORTANT: principal name for students = rollNumber
                    user.getPasswordHash(),
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
            );
        }

        // 2) Admin (and any non-student) flow: JWT subject is users.username
        User user = userRepo.findByUsername(subject)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}