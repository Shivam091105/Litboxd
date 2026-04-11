package com.booklens.dto.review;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewDto {
    private Long   id;
    private String content;
    private boolean hasSpoiler;
    private int    likesCount;
    private boolean likedByCurrentUser;

    // Book snippet — only the fields needed for review cards
    private String bookExternalId;
    private String bookTitle;
    private String bookAuthor;
    private String bookCoverUrl;

    // Author snippet
    private Long   userId;
    private String username;
    private String displayName;
    private String avatarUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
