package com.booklens.books;

import com.booklens.dto.book.BookDto;
import com.booklens.dto.book.BookSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * OpenLibraryClient
 *
 * Low-level HTTP client for the Open Library API.
 * Responsibilities:
 * - Make HTTP calls to openlibrary.org
 * - Map raw API responses to BookDto
 * - Handle API errors gracefully (timeouts, 404s, etc.)
 *
 * This class does NOT cache or store anything.
 * Caching is handled one layer up in BookApiService.
 *
 * API docs: https://openlibrary.org/developers/api
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OpenLibraryClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${open-library.base-url}")
    private String baseUrl;

    @Value("${open-library.covers-url}")
    private String coversUrl;

    private static final int DEFAULT_PAGE_SIZE = 20;

    // ── Search ────────────────────────────────────────────────────────────

    /**
     * Search for books by query string.
     * Uses Open Library /search.json endpoint.
     *
     * @param query free-text query (title, author, ISBN, etc.)
     * @param page  0-based page number
     * @param size  results per page (max 100)
     */
    @SuppressWarnings("unchecked")
    public BookSearchResponse search(String query, int page, int size) {
        int limit = Math.min(size, 100);
        int offset = page * limit;

        try {
            WebClient client = webClientBuilder.baseUrl(baseUrl).build();

            Map<String, Object> response = client.get()
                    .uri(uri -> uri
                            .path("/search.json")
                            .queryParam("q", query)
                            .queryParam("limit", limit)
                            .queryParam("offset", offset)
                            .queryParam("fields",
                                    "key,title,author_name,author_key,isbn,first_publish_year," +
                                            "number_of_pages_median,subject,cover_i,publisher,language")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(8))
                    .block();

            if (response == null)
                return emptySearch(query, page, size);

            int numFound = ((Number) response.getOrDefault("numFound", 0)).intValue();
            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.getOrDefault("docs", List.of());

            List<BookDto> books = docs.stream()
                    .map(this::docToBookDto)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            return BookSearchResponse.builder()
                    .books(books)
                    .page(page)
                    .size(size)
                    .totalResults(numFound)
                    .hasMore((offset + books.size()) < numFound)
                    .query(query)
                    .build();

        } catch (WebClientResponseException e) {
            log.warn("Open Library search API error {}: {}", e.getStatusCode(), query);
            return emptySearch(query, page, size);
        } catch (Exception e) {
            log.error("Open Library search failed for '{}': {}", query, e.getMessage());
            return emptySearch(query, page, size);
        }
    }

    // ── Fetch single work by ID ───────────────────────────────────────────

    /**
     * Fetch detailed info for a single book by its Open Library work ID.
     * e.g. workId = "OL45804W"
     *
     * Combines data from /works/{id}.json and /works/{id}/editions.json
     */
    @SuppressWarnings("unchecked")
    public Optional<BookDto> fetchWork(String workId) {
        try {
            WebClient client = webClientBuilder.baseUrl(baseUrl).build();

            // Fetch work (main metadata)
            Map<String, Object> work = client.get()
                    .uri("/works/{workId}.json", workId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(8))
                    .block();

            if (work == null)
                return Optional.empty();

            // Fetch editions for ISBN, page count, publisher
            Map<String, Object> editions = null;
            try {
                editions = client.get()
                        .uri(uri -> uri
                                .path("/works/{workId}/editions.json")
                                .queryParam("limit", 1)
                                .build(workId))
                        .retrieve()
                        .bodyToMono(Map.class)
                        .timeout(java.time.Duration.ofSeconds(5))
                        .block();
            } catch (Exception e) {
                log.debug("Could not fetch editions for {}: {}", workId, e.getMessage());
            }

            BookDto dto = workToBookDto(workId, work, editions);
            return Optional.ofNullable(dto);

        } catch (WebClientResponseException.NotFound e) {
            log.debug("Book not found in Open Library: {}", workId);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Failed to fetch work {}: {}", workId, e.getMessage());
            return Optional.empty();
        }
    }

    // ── Mapping: search doc → BookDto ─────────────────────────────────────

    @SuppressWarnings("unchecked")
    private BookDto docToBookDto(Map<String, Object> doc) {
        try {
            String key = str(doc, "key");
            if (key == null)
                return null;

            // Strip "/works/" prefix → "OL45804W"
            String externalId = key.replace("/works/", "");

            // Authors
            List<?> authorNames = (List<?>) doc.get("author_name");
            String author = authorNames != null && !authorNames.isEmpty()
                    ? authorNames.get(0).toString()
                    : "Unknown Author";
            List<String> authors = authorNames != null
                    ? authorNames.stream().map(Object::toString).limit(5).collect(Collectors.toList())
                    : List.of();

            // Cover
            Object coverId = doc.get("cover_i");
            String coverL = coverId != null ? coversUrl + "/id/" + coverId + "-L.jpg" : null;
            String coverM = coverId != null ? coversUrl + "/id/" + coverId + "-M.jpg" : null;

            // ISBN
            List<?> isbns = (List<?>) doc.get("isbn");
            String isbn = (isbns != null && !isbns.isEmpty()) ? isbns.get(0).toString() : null;

            // Year
            Object yr = doc.get("first_publish_year");
            Integer year = yr != null ? ((Number) yr).intValue() : null;

            // Pages
            Object pg = doc.get("number_of_pages_median");
            Integer pages = pg != null ? ((Number) pg).intValue() : null;

            // Genres from subjects (first 5, skip long/noisy ones)
            List<?> subjects = (List<?>) doc.get("subject");
            List<String> genres = subjects != null
                    ? subjects.stream()
                            .map(Object::toString)
                            .filter(s -> s.length() < 50 && !s.contains("--") && !s.matches(".*\\d{4}.*"))
                            .limit(5)
                            .collect(Collectors.toList())
                    : List.of();

            // Publisher
            List<?> pubs = (List<?>) doc.get("publisher");
            String publisher = (pubs != null && !pubs.isEmpty()) ? pubs.get(0).toString() : null;

            return BookDto.builder()
                    .externalId(externalId)
                    .title(str(doc, "title"))
                    .author(author)
                    .authors(authors)
                    .coverUrl(coverL)
                    .coverUrlSmall(coverM)
                    .publishYear(year)
                    .pageCount(pages)
                    .genres(genres)
                    .isbn(isbn)
                    .publisher(publisher)
                    .build();

        } catch (Exception e) {
            log.debug("Failed to map search doc to BookDto: {}", e.getMessage());
            return null;
        }
    }

    // ── Mapping: work detail → BookDto ────────────────────────────────────

    @SuppressWarnings("unchecked")
    private BookDto workToBookDto(String workId, Map<String, Object> work, Map<String, Object> editions) {
        try {
            // Title
            String title = str(work, "title");

            // Authors — resolve names from /authors/{id}.json
            List<String> authors = new ArrayList<>();
            Object authorsObj = work.get("authors");
            if (authorsObj instanceof List<?> authorList) {
                for (Object item : authorList) {
                    if (item instanceof Map<?, ?> authorEntry) {
                        Object authorRef = authorEntry.get("author");
                        if (authorRef instanceof Map<?, ?> authorMap) {
                            String authorKey = authorMap.get("key") != null ? authorMap.get("key").toString() : null;
                            if (authorKey != null) {
                                try {
                                    String authorId = authorKey.replace("/authors/", "");
                                    WebClient authorClient = webClientBuilder.baseUrl(baseUrl).build();
                                    Map<String, Object> authorData = authorClient.get()
                                            .uri("/authors/{id}.json", authorId)
                                            .retrieve()
                                            .bodyToMono(Map.class)
                                            .timeout(java.time.Duration.ofSeconds(3))
                                            .block();
                                    if (authorData != null && authorData.get("name") != null) {
                                        authors.add(authorData.get("name").toString());
                                    }
                                } catch (Exception e) {
                                    log.debug("Could not resolve author {}: {}", authorKey, e.getMessage());
                                }
                            }
                        }
                    }
                    if (authors.size() >= 5)
                        break; // cap at 5 authors
                }
            }

            // Description
            String description = extractDescription(work.get("description"));

            // Cover
            Object covers = work.get("covers");
            String coverL = null, coverM = null;
            if (covers instanceof List<?> coverList && !coverList.isEmpty()) {
                Object firstCover = coverList.get(0);
                if (firstCover instanceof Number n && n.intValue() > 0) {
                    coverL = coversUrl + "/id/" + n.intValue() + "-L.jpg";
                    coverM = coversUrl + "/id/" + n.intValue() + "-M.jpg";
                }
            }

            // Subjects
            List<?> subjects = (List<?>) work.get("subjects");
            List<String> genres = subjects != null
                    ? subjects.stream()
                            .map(Object::toString)
                            .filter(s -> s.length() < 50 && !s.contains("--"))
                            .limit(8)
                            .collect(Collectors.toList())
                    : List.of();

            // Enrich from editions
            String isbn = null;
            Integer pages = null;
            String publisher = null;
            Integer year = null;

            if (editions != null) {
                List<Map<String, Object>> entries = (List<Map<String, Object>>) editions.getOrDefault("entries",
                        List.of());
                if (!entries.isEmpty()) {
                    Map<String, Object> ed = entries.get(0);
                    List<?> isbns = (List<?>) ed.get("isbn_13");
                    if (isbns == null)
                        isbns = (List<?>) ed.get("isbn_10");
                    isbn = (isbns != null && !isbns.isEmpty()) ? isbns.get(0).toString() : null;

                    Object pg = ed.get("number_of_pages");
                    pages = pg != null ? ((Number) pg).intValue() : null;

                    List<?> pubs = (List<?>) ed.get("publishers");
                    publisher = (pubs != null && !pubs.isEmpty()) ? pubs.get(0).toString() : null;

                    Object py = ed.get("publish_date");
                    if (py != null) {
                        try {
                            // date formats: "2003", "August 12, 2003", "2003-08-12"
                            String dateStr = py.toString().trim();
                            year = Integer.parseInt(dateStr.replaceAll(".*?(\\d{4}).*", "$1"));
                        } catch (Exception ignored) {
                        }
                    }
                }
            }

            return BookDto.builder()
                    .externalId(workId)
                    .title(title)
                    .author(authors.isEmpty() ? "Unknown Author" : authors.get(0))
                    .authors(authors)
                    .coverUrl(coverL)
                    .coverUrlSmall(coverM)
                    .description(description)
                    .genres(genres)
                    .isbn(isbn)
                    .publishYear(year)
                    .pageCount(pages)
                    .publisher(publisher)
                    .build();

        } catch (Exception e) {
            log.error("Failed to map work {} to BookDto: {}", workId, e.getMessage());
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String str(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private String extractDescription(Object desc) {
        if (desc == null)
            return null;
        if (desc instanceof String s)
            return s.length() > 2000 ? s.substring(0, 2000) + "…" : s;
        if (desc instanceof Map<?, ?> m) {
            Object val = m.get("value");
            if (val instanceof String s)
                return s.length() > 2000 ? s.substring(0, 2000) + "…" : s;
        }
        return null;
    }

    private BookSearchResponse emptySearch(String query, int page, int size) {
        return BookSearchResponse.builder()
                .books(List.of())
                .page(page)
                .size(size)
                .totalResults(0)
                .hasMore(false)
                .query(query)
                .build();
    }

    /** Build cover URL from ISBN (fallback method) */
    public String buildIsbnCoverUrl(String isbn) {
        return isbn != null ? coversUrl + "/isbn/" + isbn + "-L.jpg" : null;
    }

    // ── Browse by subject ─────────────────────────────────────────────────

    /**
     * Fetch books for a specific subject/genre using Open Library's subjects API.
     * e.g. subject = "science_fiction" → /subjects/science_fiction.json
     *
     * This is more reliable for genre browsing than the search endpoint.
     */
    @SuppressWarnings("unchecked")
    public BookSearchResponse searchBySubject(String subject, int limit, int offset) {
        try {
            WebClient client = webClientBuilder.baseUrl(baseUrl).build();

            Map<String, Object> response = client.get()
                    .uri(uri -> uri
                            .path("/subjects/{subject}.json")
                            .queryParam("limit", Math.min(limit, 50))
                            .queryParam("offset", offset)
                            .build(subject.toLowerCase().replace(" ", "_")))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(8))
                    .block();

            if (response == null)
                return emptySearch(subject, 0, limit);

            int workCount = ((Number) response.getOrDefault("work_count", 0)).intValue();
            List<Map<String, Object>> works = (List<Map<String, Object>>) response.getOrDefault("works", List.of());

            List<BookDto> books = works.stream()
                    .map(this::subjectWorkToBookDto)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            return BookSearchResponse.builder()
                    .books(books)
                    .page(offset / Math.max(limit, 1))
                    .size(limit)
                    .totalResults(workCount)
                    .hasMore((offset + books.size()) < workCount)
                    .query(subject)
                    .build();

        } catch (Exception e) {
            log.error("Subject browse failed for '{}': {}", subject, e.getMessage());
            return emptySearch(subject, 0, limit);
        }
    }

    /**
     * Map a work object from the /subjects/ API to a BookDto.
     * The shape differs from /search.json docs.
     */
    @SuppressWarnings("unchecked")
    private BookDto subjectWorkToBookDto(Map<String, Object> work) {
        try {
            String key = str(work, "key");
            if (key == null)
                return null;

            String externalId = key.replace("/works/", "");

            // Authors
            List<Map<String, Object>> authorsList = (List<Map<String, Object>>) work.get("authors");
            String author = "Unknown Author";
            List<String> authors = List.of();
            if (authorsList != null && !authorsList.isEmpty()) {
                author = str(authorsList.get(0), "name");
                if (author == null)
                    author = "Unknown Author";
                authors = authorsList.stream()
                        .map(a -> str(a, "name"))
                        .filter(Objects::nonNull)
                        .limit(5)
                        .collect(Collectors.toList());
            }

            // Cover
            Object coverId = work.get("cover_id");
            String coverL = coverId != null ? coversUrl + "/id/" + coverId + "-L.jpg" : null;
            String coverM = coverId != null ? coversUrl + "/id/" + coverId + "-M.jpg" : null;

            // Year
            Object yr = work.get("first_publish_year");
            Integer year = yr != null ? ((Number) yr).intValue() : null;

            // Subjects
            List<?> subjects = (List<?>) work.get("subject");
            List<String> genres = subjects != null
                    ? subjects.stream()
                            .map(Object::toString)
                            .filter(s -> s.length() < 50 && !s.contains("--") && !s.matches(".*\\d{4}.*"))
                            .limit(5)
                            .collect(Collectors.toList())
                    : List.of();

            return BookDto.builder()
                    .externalId(externalId)
                    .title(str(work, "title"))
                    .author(author)
                    .authors(authors)
                    .coverUrl(coverL)
                    .coverUrlSmall(coverM)
                    .publishYear(year)
                    .genres(genres)
                    .build();

        } catch (Exception e) {
            log.debug("Failed to map subject work to BookDto: {}", e.getMessage());
            return null;
        }
    }
}
