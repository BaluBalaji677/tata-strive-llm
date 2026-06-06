# Build stage using Eclipse Temurin JDK 17 (matching project Java version 17)
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy all project files
COPY . .

# Ensure the Maven wrapper script has executable permissions and correct line endings
RUN chmod +x mvnw

# Build the jar file while skipping tests
RUN ./mvnw clean package -DskipTests

# Run stage using Eclipse Temurin JRE 17 for a lightweight production image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the automatically detected compiled jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
