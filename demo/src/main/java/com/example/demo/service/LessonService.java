package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.entity.Lesson;
import com.example.demo.entity.Module;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.ModuleRepository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class LessonService {

    private static final Logger log = LoggerFactory.getLogger(LessonService.class);

    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;

    public LessonService(LessonRepository lessonRepository, ModuleRepository moduleRepository) {
        this.lessonRepository = lessonRepository;
        this.moduleRepository = moduleRepository;
    }

    public Lesson createLesson(Long moduleId, Lesson lesson) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));
        lesson.setModule(module);
        return lessonRepository.save(lesson);
    }

    public List<Lesson> getLessonsByModule(Long moduleId) {
        return lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
    }

    @Transactional
    public Lesson updateLesson(Long id, String title, String content, Integer orderIndex) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
        
        if (title != null) lesson.setTitle(title);
        if (content != null) lesson.setContent(content);
        if (orderIndex != null) lesson.setOrderIndex(orderIndex);
        
        Lesson updatedLesson = lessonRepository.save(lesson);
        log.info("Updated lesson: {}", id);
        return updatedLesson;
    }

    @Transactional
    public void deleteLesson(Long id) {
        if (!lessonRepository.existsById(id)) {
            throw new RuntimeException("Lesson not found with id: " + id);
        }
        lessonRepository.deleteById(id);
        log.info("Deleted lesson with id: {}", id);
    }
}
