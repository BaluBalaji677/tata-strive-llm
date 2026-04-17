package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import com.example.demo.entity.Module;
import com.example.demo.service.ModuleService;

@RestController
public class ModuleController {

    private final ModuleService moduleService;

    public ModuleController(ModuleService moduleService) {
        this.moduleService = moduleService;
    }

    @PostMapping("/admin/module")
    @PreAuthorize("hasRole('ADMIN')")
    public Module createAdminModule(@RequestBody ModuleRequest request) {
        Module module = new Module();
        module.setTitle(request.title());
        return moduleService.createModule(request.courseId(), module);
    }

    public record ModuleRequest(String title, Long courseId) {}

    @PutMapping("/admin/module/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Module updateAdminModule(@PathVariable Long id, @RequestBody ModuleUpdateRequest request) {
        return moduleService.updateModule(id, request.title());
    }

    @DeleteMapping("/admin/module/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteAdminModule(@PathVariable Long id) {
        moduleService.deleteModule(id);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    public record ModuleUpdateRequest(String title) {}
}
