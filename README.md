**Litboxd**

A full-stack social platform for readers to track books, publish reviews, rate titles, and curate reading lists. LitBoxd is designed as a production-oriented application showcasing scalable backend architecture using Spring Boot and a modern, component-driven frontend built with React.

Overview BookBoxd demonstrates:
- RESTful API development with Spring Boot
- Layered backend architecture (Controller → Service → Repository)
- Secure authentication using Spring Security & JWT
- Relational data modeling with JPA/Hibernate
- Modular React frontend with API integration
- Clean separation of concerns across the stack
- The platform allows users to manage reading activity and interact socially through ratings, reviews, and curated collections.

Core Features:
- User registration & authentication (JWT-based)
- Book catalog browsing with search functionality
- Rate books (½–5 stars)
- Create, edit, and delete reviews
- Reading status tracking (Read / Currently Reading / Want to Read)
- Public and private reading lists
- Follow system with activity feed

Tech Stack 

#Backend:
- Java 17+
- Spring Boot
- Spring Web (REST)
- Spring Data JPA
- Hibernate ORM
- Spring Security (JWT Authentication)
- Maven

#Frontend:
- React
- Axios
- React Router

#Database:
- MySQL
- JPA entity mapping with relational schema

Architecture:

React Client 
    ->
Spring Boot REST API 
    -> 
Service Layer 
    ->
JPA Repositories 
    ->
Relational Database

Backend Structure:
- Controller Layer – Handles HTTP requests and validation
- Service Layer – Contains business logic
- Repository Layer – Data access abstraction via JPA
- Entity Layer – Database mappings

Future Enhancements
- Role-based access control (Admin/User)
- Pagination and performance optimization
- Caching layer (Redis)
- Docker containerization
- CI/CD pipeline integration
- Comprehensive unit & integration tests
