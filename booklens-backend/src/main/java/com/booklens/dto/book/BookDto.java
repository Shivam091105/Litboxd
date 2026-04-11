package com.booklens.dto.book;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * BookDto — the canonical "book" object the frontend receives.
 *
 * This is NEVER stored in our database. It is assembled
 * from the Open Library (or Google Books) API on every request,
 * then cached in Redis.
 *
 * The externalId field (e.g. "OL1234W") is the only identifier
 * our DB stores — in BookLog, Review, and BookList entities.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor          // ← Jackson needs this
@AllArgsConstructor         // ← Lombok builder needs this
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookDto {

    /** Open Library work ID, e.g. "OL45804W" */
    private String externalId;

    private String title;
    private String author;           // primary author display string
    private List<String> authors;    // full list if multiple

    /** Full cover URL — we construct this from Open Library cover API */
    private String coverUrl;
    private String coverUrlSmall;    // thumbnail for grids

    private Integer publishYear;
    private Integer pageCount;
    private String description;
    private String publisher;
    private String language;

    /** Comma-separated genre/subject list */
    private List<String> genres;

    private String isbn;
    private String isbn13;

    // ── Stats from OUR database (injected by the service layer) ──────────
    /** Average rating from our users (0.0 if no ratings yet) */
    private Double averageRating;

    /** How many of our users have rated this book */
    private Integer ratingsCount;

    /** How many reviews on BookLens */
    private Integer reviewsCount;

    /** How many users have logged this book */
    private Integer logsCount;

    // ── Current user's relationship (only populated when authenticated) ──
    private String  userStatus;  // WANT | READING | READ | null
    private Double  userRating;  // 0.5–5.0 | null
    private Boolean userHasReview;
}
