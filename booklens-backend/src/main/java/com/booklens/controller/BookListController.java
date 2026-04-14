package com.booklens.controller;

import com.booklens.entity.BookList;
import com.booklens.entity.User;
import com.booklens.exception.BookLensException;
import com.booklens.repository.BookListRepository;
import com.booklens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * BookListController — CRUD for user book lists.
 *
 * Endpoints:
 *   GET    /api/v1/me/lists                     — get all lists for current user
 *   POST   /api/v1/me/lists                     — create a new list
 *   PUT    /api/v1/me/lists/{listId}             — rename / update description
 *   DELETE /api/v1/me/lists/{listId}             — delete a list (not the 3 defaults)
 *   POST   /api/v1/me/lists/{listId}/books       — add a book to a list
 *   DELETE /api/v1/me/lists/{listId}/books/{externalId} — remove a book from a list
 *   POST   /api/v1/me/lists/ensure-defaults      — create default lists if they don't exist
 */
@RestController
@RequestMapping("/api/v1/me/lists")
@RequiredArgsConstructor
public class BookListController {

    private static final List<String> DEFAULT_LIST_TITLES =
            List.of("Read", "Currently Reading", "Want to Read");

    private final BookListRepository bookListRepository;
    private final UserRepository     userRepository;

    // ── GET all lists ───────────────────────────────────────────────────────
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getLists(
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        List<BookList> lists = bookListRepository.findByUserIdOrderByCreatedAtAsc(userId);
        return ResponseEntity.ok(lists.stream().map(this::toDto).collect(Collectors.toList()));
    }

    // ── Ensure default lists exist ──────────────────────────────────────────
    @PostMapping("/ensure-defaults")
    @Transactional
    public ResponseEntity<List<Map<String, Object>>> ensureDefaults(
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        User user   = getUser(userId);

        for (String title : DEFAULT_LIST_TITLES) {
            if (!bookListRepository.existsByUserIdAndTitle(userId, title)) {
                bookListRepository.save(BookList.builder()
                        .user(user)
                        .title(title)
                        .description("")
                        .isPublic(true)
                        .build());
            }
        }

        List<BookList> lists = bookListRepository.findByUserIdOrderByCreatedAtAsc(userId);
        return ResponseEntity.ok(lists.stream().map(this::toDto).collect(Collectors.toList()));
    }

    // ── Create a new list ───────────────────────────────────────────────────
    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> createList(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        String title = (String) body.getOrDefault("title", "");

        if (title == null || title.isBlank())
            throw new BookLensException("List title cannot be empty.", HttpStatus.BAD_REQUEST);
        if (title.length() > 200)
            throw new BookLensException("Title too long (max 200 chars).", HttpStatus.BAD_REQUEST);
        if (bookListRepository.existsByUserIdAndTitle(userId, title.trim()))
            throw new BookLensException("You already have a list with that name.", HttpStatus.CONFLICT);

        String description = (String) body.getOrDefault("description", "");

        BookList list = bookListRepository.save(BookList.builder()
                .user(getUser(userId))
                .title(title.trim())
                .description(description != null ? description.trim() : "")
                .isPublic(true)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(list));
    }

    // ── Update list title/description ───────────────────────────────────────
    @PutMapping("/{listId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateList(
            @PathVariable Long listId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        BookList list = getAndCheckOwner(userId, listId);

        String newTitle = (String) body.get("title");
        if (newTitle != null && !newTitle.isBlank()) {
            String trimmed = newTitle.trim();
            // Don't allow renaming default lists
            if (DEFAULT_LIST_TITLES.contains(list.getTitle()))
                throw new BookLensException("Cannot rename a default list.", HttpStatus.BAD_REQUEST);
            if (!trimmed.equals(list.getTitle()) &&
                    bookListRepository.existsByUserIdAndTitle(userId, trimmed))
                throw new BookLensException("You already have a list with that name.", HttpStatus.CONFLICT);
            list.setTitle(trimmed);
        }

        String desc = (String) body.get("description");
        if (desc != null) list.setDescription(desc.trim());

        return ResponseEntity.ok(toDto(bookListRepository.save(list)));
    }

    // ── Delete a list ───────────────────────────────────────────────────────
    @DeleteMapping("/{listId}")
    @Transactional
    public ResponseEntity<Void> deleteList(
            @PathVariable Long listId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        BookList list = getAndCheckOwner(userId, listId);

        if (DEFAULT_LIST_TITLES.contains(list.getTitle()))
            throw new BookLensException("Cannot delete a default list.", HttpStatus.BAD_REQUEST);

        bookListRepository.delete(list);
        return ResponseEntity.noContent().build();
    }

    // ── Add a book to a list ────────────────────────────────────────────────
    @PostMapping("/{listId}/books")
    @Transactional
    public ResponseEntity<Map<String, Object>> addBook(
            @PathVariable Long listId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        BookList list = getAndCheckOwner(userId, listId);

        String externalId = (String) body.get("externalId");
        if (externalId == null || externalId.isBlank())
            throw new BookLensException("externalId is required.", HttpStatus.BAD_REQUEST);

        if (!list.getExternalBookIds().contains(externalId.trim())) {
            list.getExternalBookIds().add(externalId.trim());
            bookListRepository.save(list);
        }

        return ResponseEntity.ok(toDto(list));
    }

    // ── Remove a book from a list ───────────────────────────────────────────
    @DeleteMapping("/{listId}/books/{externalId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> removeBook(
            @PathVariable Long listId,
            @PathVariable String externalId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Long userId = resolveUserId(principal);
        BookList list = getAndCheckOwner(userId, listId);
        list.getExternalBookIds().remove(externalId);
        return ResponseEntity.ok(toDto(bookListRepository.save(list)));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private Map<String, Object> toDto(BookList list) {
        return Map.of(
                "id",               list.getId(),
                "title",            list.getTitle(),
                "description",      list.getDescription() != null ? list.getDescription() : "",
                "isPublic",         list.isPublic(),
                "bookCount",        list.getExternalBookIds().size(),
                "externalBookIds",  list.getExternalBookIds(),
                "isDefault",        DEFAULT_LIST_TITLES.contains(list.getTitle()),
                "createdAt",        list.getCreatedAt() != null ? list.getCreatedAt().toString() : ""
        );
    }

    private BookList getAndCheckOwner(Long userId, Long listId) {
        BookList list = bookListRepository.findById(listId)
                .orElseThrow(() -> new BookLensException("List not found.", HttpStatus.NOT_FOUND));
        if (!list.getUser().getId().equals(userId))
            throw new BookLensException("Not authorized.", HttpStatus.FORBIDDEN);
        return list;
    }

    private Long resolveUserId(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new BookLensException("User not found.", HttpStatus.UNAUTHORIZED))
                .getId();
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BookLensException("User not found.", HttpStatus.NOT_FOUND));
    }
}