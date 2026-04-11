package com.booklens.dto.log;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookLogDto {
    private Long   id;
    private String status;       // WANT | READING | READ

    // Stored as 2–10 internally; exposed as 0.5–5.0 stars
    private Double rating;       // e.g. 4.5

    private LocalDate startedAt;
    private LocalDate finishedAt;
    private boolean   reread;
    private boolean   privateEntry;
    private String    tags;

    // Book info fetched from external API and merged here
    private String bookExternalId;
    private String bookTitle;
    private String bookAuthor;
    private String bookCoverUrl;

    // User snippet
    private Long   userId;
    private String username;
    private String displayName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
