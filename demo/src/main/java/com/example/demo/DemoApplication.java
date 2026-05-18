package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DemoApplication {

	private static final Logger log = LoggerFactory.getLogger(DemoApplication.class);

	public static void main(String[] args) {
		ApplicationContext context = SpringApplication.run(DemoApplication.class, args);
		validateUserRoleSchema(context);
		seedPrincipalUser(context);
	}

	private static void validateUserRoleSchema(ApplicationContext context) {
		try {
			JdbcTemplate jdbcTemplate = context.getBean(JdbcTemplate.class);
			jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role ENUM('PRINCIPAL','ADMIN','STUDENT') NULL");
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
						"UPDATE users SET role = 'PRINCIPAL', email = COALESCE(email, ?), full_name = COALESCE(full_name, ?), must_change_password = COALESCE(must_change_password, b'1') WHERE username = ?",
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

}
