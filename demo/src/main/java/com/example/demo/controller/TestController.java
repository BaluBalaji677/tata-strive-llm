package com.example.demo.controller;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {

    private final PasswordEncoder encoder;

    public TestController(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    @GetMapping("/test/hash")
public String hash() {
    return encoder.encode("1122334455");
}
}