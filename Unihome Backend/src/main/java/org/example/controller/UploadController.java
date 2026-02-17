package org.example.controller;

import org.example.dto.common.UploadResponse;
import org.example.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/uploads")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class UploadController {

    private final FileStorageService fileStorageService;

    public UploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/images")
    @PreAuthorize("hasAnyRole('OWNER','STUDENT','REGULAR')")
    public ResponseEntity<List<UploadResponse>> uploadImages(
        @RequestParam("files") List<MultipartFile> files,
        @RequestParam(value = "category", required = false) String category
    ) {
        List<UploadResponse> responses = fileStorageService.storeImages(files, category);
        return ResponseEntity.ok(responses);
    }
}
