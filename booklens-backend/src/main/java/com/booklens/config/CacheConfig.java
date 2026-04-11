package com.booklens.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.*;

import java.time.Duration;
import java.util.Map;

/**
 * CacheConfig
 *
 * Redis cache configuration with per-cache TTL settings.
 *
 * Cache strategy (mirrors Letterboxd approach):
 *   - book-search:  10 min — search results change slowly; reduces Open Library load
 *   - book-detail:  30 min — individual book metadata is stable
 *   - recommendations: 60 min — expensive to compute, invalidated on user action
 *   - popular:      5 min — home page popular books, refreshes more often
 *
 * NOTE: If Redis is not running, the app falls back to no-cache mode.
 * Set spring.cache.type=none in application.yml to disable caching entirely.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${recommendation.cache-ttl-minutes:60}")
    private int recommendationTtl;

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
            .disableCachingNullValues()
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                new GenericJackson2JsonRedisSerializer()
            ));

        return RedisCacheManager.builder(factory)
            .cacheDefaults(base.entryTtl(Duration.ofMinutes(10)))
            .withInitialCacheConfigurations(Map.of(
                "book-search",      base.entryTtl(Duration.ofMinutes(10)),
                "book-detail",      base.entryTtl(Duration.ofMinutes(30)),
                "recommendations",  base.entryTtl(Duration.ofMinutes(recommendationTtl)),
                "popular",          base.entryTtl(Duration.ofMinutes(5))
            ))
            .build();
    }
}
