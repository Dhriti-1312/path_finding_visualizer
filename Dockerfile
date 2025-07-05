# Build Stage
FROM maven:3.8-openjdk-17 AS build
WORKDIR /app
COPY backend/ /app
RUN mvn clean install -DskipTests

# Runtime Stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
CMD ["java", "-jar", "app.jar"]
