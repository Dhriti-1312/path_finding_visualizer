# -------- Build Stage --------
FROM maven:3.9.6-eclipse-temurin-17 AS build

# Set working directory inside container
WORKDIR /app

# Copy only backend folder content to container
COPY backend/ /app

# Build the Maven project (skip tests to speed up)
RUN mvn clean install -DskipTests

# -------- Runtime Stage --------
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy built jar from previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port
EXPOSE 8080

# Start the Spring Boot app
CMD ["java", "-jar", "app.jar"]
