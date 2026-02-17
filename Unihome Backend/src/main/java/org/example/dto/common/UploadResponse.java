package org.example.dto.common;

public class UploadResponse {

    private final String originalName;
    private final String fileName;
    private final String url;
    private final long size;

    public UploadResponse(String originalName, String fileName, String url, long size) {
        this.originalName = originalName;
        this.fileName = fileName;
        this.url = url;
        this.size = size;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getFileName() {
        return fileName;
    }

    public String getUrl() {
        return url;
    }

    public long getSize() {
        return size;
    }
}
