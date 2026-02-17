package org.example.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final Path uploadPath;

    public WebConfig(@Value("${unihome.uploads.dir:uploads}") String uploadsDir) {
        this.uploadPath = Paths.get(uploadsDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to initialize uploads directory", exception);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = uploadPath.toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}
