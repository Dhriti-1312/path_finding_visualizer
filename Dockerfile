# -------- Build Stage --------
FROM maven:3.8-openjdk-17 AS build

# Set working directory to /app
WORKDIR /app

# Copy the backend folder content into /app
COPY backend/ /app

# Build the project (skipping tests for speed)
RUN mvn clean install -DskipTests

# -------- Runtime Stage --------
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy the jar from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the jar
CMD ["java", "-jar", "app.jar"]
