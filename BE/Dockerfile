# syntax=docker/dockerfile:1.7

# Stage 1: Build
FROM maven:3.9.8-amazoncorretto-21 AS build
WORKDIR /app
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp -Dmaven.wagon.http.retryHandler.count=5 dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp -Dmaven.wagon.http.retryHandler.count=5 package -DskipTests

# Stage 2: Run
FROM amazoncorretto:21.0.4
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Tạo thư mục log và cấp quyền
RUN mkdir -p /var/log/hourlink \
    && chown 1000:1000 /var/log/hourlink

# Copy .env
COPY .env .env

VOLUME /var/log/hourlink
ENTRYPOINT ["java", "-jar", "app.jar"]
