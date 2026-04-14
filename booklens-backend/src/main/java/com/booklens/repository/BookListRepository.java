package com.booklens.repository;

import com.booklens.entity.BookList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookListRepository extends JpaRepository<BookList, Long> {

    List<BookList> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<BookList> findByUserIdAndTitle(Long userId, String title);

    boolean existsByUserIdAndTitle(Long userId, String title);

    @Query("SELECT COUNT(bl) FROM BookList bl WHERE bl.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}