package com.booklens.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BookLensException extends RuntimeException {

    private final HttpStatus status;

    public BookLensException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
