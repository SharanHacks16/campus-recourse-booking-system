# Stage 1: Build JAR
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY settings.xml .
COPY src ./src
RUN mvn clean package -DskipTests -s settings.xml -B \
    -Dmaven.wagon.http.retryHandler.count=5 \
    -Dmaven.wagon.http.pool=false

# Stage 2: Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /app/target/campus-booking-backend-*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=mysql
ENTRYPOINT ["java", "-jar", "app.jar"]
