package org.example.service;

import org.example.dto.common.UploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final Path rootLocation;

    public FileStorageService(@Value("${unihome.uploads.dir:uploads}") String uploadsDir) {
        this.rootLocation = Paths.get(uploadsDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not initialize upload directory", exception);
        }
    }

    public List<UploadResponse> storeImages(List<MultipartFile> files, String category) {
        List<UploadResponse> responses = new ArrayList<>();
        if (files == null || files.isEmpty()) {
            return responses;
        }

        String safeCategory = sanitizeCategory(category);
        Path categoryLocation = rootLocation.resolve(safeCategory).resolve(todayFolder());
        try {
            Files.createDirectories(categoryLocation);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not create upload directory", exception);
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            if (!isSupportedContentType(file.getContentType())) {
                continue;
            }

            String extension = resolveExtension(file);
            String generatedName = generateFileName(extension);
            Path targetLocation = categoryLocation.resolve(generatedName);

            try {
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                String fileUrl = buildPublicUrl(safeCategory, categoryLocation.getFileName().toString(), generatedName);
                responses.add(new UploadResponse(
                    file.getOriginalFilename(),
                    generatedName,
                    fileUrl,
                    file.getSize()
                ));
            } catch (IOException exception) {
                throw new IllegalStateException("Failed to store file " + file.getOriginalFilename(), exception);
            }
        }

        return responses;
    }

    private String sanitizeCategory(String input) {
        String candidate = input == null ? "general" : input.trim().toLowerCase();
        if (candidate.isEmpty()) {
            return "general";
        }
        return candidate.replaceAll("[^a-z0-9-]", "-");
    }

    private String todayFolder() {
        return DATE_FORMATTER.format(LocalDate.now());
    }

    private boolean isSupportedContentType(String contentType) {
        if (contentType == null) {
            return false;
        }
        return contentType.startsWith("image/");
    }

    private String resolveExtension(MultipartFile file) {
        String original = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        int dotIndex = original.lastIndexOf('.');
        if (dotIndex > -1 && dotIndex < original.length() - 1) {
            return original.substring(dotIndex);
        }
        String contentType = file.getContentType();
        if (contentType != null && contentType.startsWith("image/")) {
            return "." + contentType.substring("image/".length());
        }
        return ".jpg";
    }

    private String generateFileName(String extension) {
        return UUID.randomUUID() + extension;
    }

    private String buildPublicUrl(String category, String dateFolder, String fileName) {
        return "/uploads/" + category + "/" + dateFolder + "/" + fileName;
    }
}
