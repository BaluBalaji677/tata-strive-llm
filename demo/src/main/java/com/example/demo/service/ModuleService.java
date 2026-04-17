package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.entity.Module;
import com.example.demo.entity.Course;
import com.example.demo.repository.ModuleRepository;
import com.example.demo.repository.CourseRepository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ModuleService {

    private static final Logger log = LoggerFactory.getLogger(ModuleService.class);

    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    public ModuleService(ModuleRepository moduleRepository, CourseRepository courseRepository) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
    }

    public Module createModule(Long courseId, Module module) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        module.setCourse(course);
        return moduleRepository.save(module);
    }

    public List<Module> getModulesByCourse(Long courseId) {
        return moduleRepository.findByCourseId(courseId);
    }

    @Transactional
    public Module updateModule(Long id, String title) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found with id: " + id));
        
        if (title != null) module.setTitle(title);
        
        Module updatedModule = moduleRepository.save(module);
        log.info("Updated module: {}", id);
        return updatedModule;
    }

    @Transactional
    public void deleteModule(Long id) {
        if (!moduleRepository.existsById(id)) {
            throw new RuntimeException("Module not found with id: " + id);
        }
        moduleRepository.deleteById(id);
        log.info("Deleted module with id: {}", id);
    }
}
