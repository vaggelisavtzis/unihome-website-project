package org.example.dto.common;

import java.util.List;

public class PagedResponse<T> {

    private List<T> items;
    private long totalItems;
    private int totalPages;
    private int page;
    private int size;

    public PagedResponse() {
    }

    public PagedResponse(List<T> items, long totalItems, int totalPages, int page, int size) {
        this.items = items;
        this.totalItems = totalItems;
        this.totalPages = totalPages;
        this.page = page;
        this.size = size;
    }

    public List<T> getItems() {
        return items;
    }

    public void setItems(List<T> items) {
        this.items = items;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }
}
