package com.booklens.dto.book;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor          // ← Jackson needs this
@AllArgsConstructor         // ← Lombok builder needs this
public class BookSearchResponse {
    private List<BookDto> books;
    private int           page;
    private int           size;
    private int           totalResults;   // total from external API
    private boolean       hasMore;
    private String        query;
}
