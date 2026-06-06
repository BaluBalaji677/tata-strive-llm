-- Identify invalid quiz assignments
-- These are assignments where the quiz creator is not the student's assigned teacher.
SELECT qa.id, qa.quiz_id, q.title AS quiz_title, q.created_by_user_id AS quiz_creator_id, qa.student_id, s.full_name AS student_name, c.teacher_id AS student_teacher_id
FROM quiz_assignments qa
JOIN quiz q ON qa.quiz_id = q.id
JOIN students s ON qa.student_id = s.id
JOIN course c ON s.course_id = c.id
WHERE q.created_by_user_id IS NOT NULL
  AND c.teacher_id IS NOT NULL
  AND q.created_by_user_id != c.teacher_id;

-- Delete invalid quiz assignments
-- DELETE qa FROM quiz_assignments qa
-- JOIN quiz q ON qa.quiz_id = q.id
-- JOIN students s ON qa.student_id = s.id
-- JOIN course c ON s.course_id = c.id
-- WHERE q.created_by_user_id IS NOT NULL
--   AND c.teacher_id IS NOT NULL
--   AND q.created_by_user_id != c.teacher_id;
