package com.booklens;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // enables @Scheduled tasks (e.g. cache warming, trending recalculation)
public class BookLensApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookLensApplication.class, args);
    }
}
