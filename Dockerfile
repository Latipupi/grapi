# Gunakan image JRE Java 17 yang ringan sebagai base image
FROM eclipse-temurin:17-jre-alpine

# Set directory kerja di dalam container
WORKDIR /app

# Salin file JAR hasil build dari direktori target ke dalam container
# Nama JAR menyesuaikan dengan pom.xml (grapi-0.0.1-SNAPSHOT.jar)
COPY target/grapi-0.0.1-SNAPSHOT.jar app.jar

# Ekspos port aplikasi yang digunakan (8080)
EXPOSE 8080

# Atur opsi JVM untuk performa optimal di produksi
ENV JAVA_OPTS="-XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Xms512m -Xmx1024m"

# Jalankan aplikasi Spring Boot
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
