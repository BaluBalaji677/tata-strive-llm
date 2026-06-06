package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.Objects;

@SpringBootApplication
@EnableScheduling
public class DemoApplication {

	private static final Logger log = LoggerFactory.getLogger(DemoApplication.class);

	public static void main(String[] args) {
		ApplicationContext context = SpringApplication.run(DemoApplication.class, args);
		validateUserRoleSchema(context);
		relaxStudentRollNumberGlobalUniqueness(context);
		seedPrincipalUser(context);
	}

	private static void validateUserRoleSchema(ApplicationContext context) {
		try {
			JdbcTemplate jdbcTemplate = context.getBean(JdbcTemplate.class);
			String dbType = "mysql";
			try (java.sql.Connection conn = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
				String productName = conn.getMetaData().getDatabaseProductName().toLowerCase();
				if (productName.contains("postgres")) {
					dbType = "postgres";
				}
			}
			if ("mysql".equals(dbType)) {
				jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role ENUM('PRINCIPAL','ADMIN','STUDENT') NULL");
			}
			jdbcTemplate.update("UPDATE users SET role = 'ADMIN' WHERE role IS NULL AND username = 'admin1'");
			Integer nullRoles = jdbcTemplate.queryForObject(
					"SELECT COUNT(*) FROM users WHERE role IS NULL",
					Integer.class
			);
			log.info("[AUTH] users.role schema validated; null role count={}", nullRoles);
		} catch (Exception e) {
			log.error("[AUTH] Error validating users.role schema", e);
		}
	}

	private static void seedPrincipalUser(ApplicationContext context) {
		try {
			com.example.demo.repository.UserRepository userRepo = context.getBean(com.example.demo.repository.UserRepository.class);
			org.springframework.security.crypto.password.PasswordEncoder encoder = context.getBean(org.springframework.security.crypto.password.PasswordEncoder.class);
			JdbcTemplate jdbcTemplate = context.getBean(JdbcTemplate.class);

			Integer principalCount = jdbcTemplate.queryForObject(
					"SELECT COUNT(*) FROM users WHERE username = ?",
					Integer.class,
					"principal"
			);
			if (principalCount != null && principalCount > 0) {
				jdbcTemplate.update(
						"UPDATE users SET role = 'PRINCIPAL', email = COALESCE(email, ?), full_name = COALESCE(full_name, ?), must_change_password = COALESCE(must_change_password, true) WHERE username = ?",
						"principal@lms.edu",
						"Principal",
						"principal"
				);
				log.info("[SEED] Principal user already exists and was normalized");
				return;
			}

			com.example.demo.entity.User principal = new com.example.demo.entity.User();
			principal.setUsername("principal");
			principal.setEmail("principal@lms.edu");
			principal.setFullName("Principal");
			principal.setPasswordHash(encoder.encode("principal123"));
			principal.setRole(com.example.demo.entity.Role.PRINCIPAL);
			principal.setMustChangePassword(true);

			userRepo.save(principal);
			log.info("[SEED] Principal user created successfully: username=principal");

		} catch (Exception e) {
			log.error("[SEED] Error seeding principal user", e);
		}
	}

	private static void relaxStudentRollNumberGlobalUniqueness(ApplicationContext context) {
		try {
			JdbcTemplate jdbcTemplate = context.getBean(JdbcTemplate.class);
			String dbType = "mysql";
			try (java.sql.Connection conn = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
				String productName = conn.getMetaData().getDatabaseProductName().toLowerCase();
				if (productName.contains("postgres")) {
					dbType = "postgres";
				}
			}

			if ("postgres".equals(dbType)) {
				// Query unique constraints on students.roll_number in PostgreSQL
				java.util.List<String> constraints = jdbcTemplate.queryForList(
						"""
						SELECT con.conname
						FROM pg_constraint con
						JOIN pg_class rel ON rel.oid = con.conrelid
						JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY(con.conkey)
						WHERE rel.relname = 'students'
						  AND con.contype = 'u'
						  AND attr.attname = 'roll_number'
						""",
						String.class
				);
				for (String constraintName : constraints) {
					jdbcTemplate.execute("ALTER TABLE students DROP CONSTRAINT " + constraintName);
					log.info("[SCHEMA] Dropped global unique roll_number constraint on PostgreSQL: {}", constraintName);
				}

				// Query unique indexes on students.roll_number in PostgreSQL that are not constraints
				java.util.List<String> indexes = jdbcTemplate.queryForList(
						"""
						SELECT idx.relname
						FROM pg_index i
						JOIN pg_class tbl ON tbl.oid = i.indrelid
						JOIN pg_class idx ON idx.oid = i.indexrelid
						JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(i.indkey)
						WHERE tbl.relname = 'students'
						  AND i.indisunique = true
						  AND a.attname = 'roll_number'
						""",
						String.class
				);
				for (String indexName : indexes) {
					try {
						jdbcTemplate.execute("DROP INDEX " + indexName);
						log.info("[SCHEMA] Dropped global unique roll_number index on PostgreSQL: {}", indexName);
					} catch (Exception e) {
						log.warn("[SCHEMA] Could not drop index {} directly: {}", indexName, e.getMessage());
					}
				}

				// Check if non-unique index exists in PostgreSQL
				Integer indexCount = jdbcTemplate.queryForObject(
						"""
						SELECT COUNT(*)
						FROM pg_indexes
						WHERE tablename = 'students'
						  AND indexname = 'idx_students_roll_number'
						""",
						Integer.class
				);
				if (indexCount == null || indexCount == 0) {
					jdbcTemplate.execute("CREATE INDEX idx_students_roll_number ON students (roll_number)");
					log.info("[SCHEMA] Created non-unique roll_number index on PostgreSQL");
				}

			} else {
				// Original MySQL logic
				java.util.List<String> indexNames = jdbcTemplate.queryForList(
						"""
						SELECT INDEX_NAME
						FROM INFORMATION_SCHEMA.STATISTICS
						WHERE TABLE_SCHEMA = DATABASE()
						  AND TABLE_NAME = 'students'
						GROUP BY INDEX_NAME
						HAVING MAX(NON_UNIQUE) = 0
						   AND COUNT(*) = 1
						   AND MAX(CASE WHEN COLUMN_NAME = 'roll_number' THEN 1 ELSE 0 END) = 1
						""",
						String.class
				);

				for (String indexName : indexNames) {
					if (!"PRIMARY".equalsIgnoreCase(indexName)) {
						jdbcTemplate.execute("ALTER TABLE students DROP INDEX " + indexName);
						log.info("[SCHEMA] Dropped global unique roll_number index: {}", indexName);
					}
				}

				Integer rollNumberIndexCount = jdbcTemplate.queryForObject(
						"""
						SELECT COUNT(*)
						FROM INFORMATION_SCHEMA.STATISTICS
						WHERE TABLE_SCHEMA = DATABASE()
						  AND TABLE_NAME = 'students'
						  AND INDEX_NAME = 'idx_students_roll_number'
						""",
						Integer.class
				);

				if (rollNumberIndexCount == null || rollNumberIndexCount == 0) {
					jdbcTemplate.execute("CREATE INDEX idx_students_roll_number ON students (roll_number)");
					log.info("[SCHEMA] Created non-unique roll_number index for student lookups");
				}
			}
		} catch (Exception e) {
			log.error("[SCHEMA] Error relaxing student roll number uniqueness", e);
		}
	}

}
