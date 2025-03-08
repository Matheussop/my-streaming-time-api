# CHANGELOG.md

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Release Process
1. Code freeze and testing
2. Version bump in package.json
3. Update CHANGELOG.md
4. Create release tag
5. Deploy to production

## [Unreleased]
### Planned
- User authentication and authorization
- Enhanced error handling
- Performance optimizations
- Additional TMDB features

### Added

- ObjectID Validation: Robust validation for MongoDB ObjectIDs using Zod
  - Reusable `objectIdSchema` for consistent ID validation across the application
  - Middleware for validating single and multiple ObjectIDs in requests
  - Type-safe conversion between string IDs and MongoDB ObjectIDs
  - Integration with existing error handling middleware
  - Extended Express Request interface to include validated IDs
- Genre Management: Comprehensive genre management for streaming types
  - Support for adding and removing genres from streaming types
  - Robust genre validation with detailed error checking
  - New routes and controller methods for genre operations
  - Complete CRUD operations for genre management
- Content Base Model: New architecture for content models
  - Implementation of discriminator pattern for movie model inheritance
  - Improved type safety and error handling for content-related operations
- Zod Validation: Enhanced validation for genre data
  - Genre schema with strict validation rules
  - Custom error formatting for Zod validation errors
  - Enhanced error handling middleware to support Zod validation
- Documentation: An ARCHITECTURE.md file was created to registry the decisions about the project
- Documentation: Expanded README with comprehensive model and feature descriptions
  - Detailed model schemas for all entities
  - Enhanced descriptions of existing features
  - Added Series management section
- User Streaming History: New features and enhancements
  - Added streamingType field to user streaming history model
  - New endpoint to fetch user streaming history by user and streaming ID
  - Support for series in streaming history retrieval
- Season: Implement full season management features for the streaming platform:
  - Create SeasonController with CRUD operations for seasons
  - Develop SeasonService and SeasonRepository
  - Extend error messages with season-specific validation
  - Update interfaces for season repositories and services
  - Modify season model to support dynamic episode tracking

### Changed
- Validation Architecture: Improved validation architecture with Zod
  - Moved validation logic to route level for better separation of concerns
  - Standardized validation approach across all routes
  - Enhanced type safety with Zod schema inference
  - Improved error messages for validation failures
- Series Model: Standardized series model with content base model
  - Updated interfaces to support flexible genre references
  - Modified model to handle dynamic genre input
  - Improved genre validation in pre-validation middleware
- Movie Model: Enhanced with release date attribute
  - Refactored to inherit from content base model
  - Optimized database queries for better performance
- Streaming Type: Enhanced with improved genre management
  - Updated repository and service to support genre operations
  - Improved database query performance with optimized index creation
- Season: 
  - Add new routes for season-related endpoints

- User Streaming History: Enhanced with improved data handling
  - Updated flow after model refactoring
  - Add support for episode-specific tracking (episodeId, seasonNumber, episodeNumber)
  - Implement new methods for watch progress and history management
  - Enhanced validation for streaming history entries
  - Optimized queries for better performance
  - Improved error handling for user streaming history operations
- Error Messages: Standardized error messages across models and interfaces
  - Centralized error message constants
  - Consistent error formatting across the application
  - refactor: Enhance User Streaming History with Comprehensive Tracking Features

### Fixed
- Genre Validation: Enhanced validation for genre ID, name, and uniqueness
- Error Messages: Improved error messages for genre-related operations
- Database Queries: Optimized queries for better performance
- Mongoose Imports: Removed unused imports from Movie and Content Models

## [1.2.0]
### Added
- Series Management: Complete functionality for series management including routes, models, services, controllers, and repository methods
- Episodes Model: New model for managing series episodes with duration, cast, and rating
- Poster Field: Added poster field to movie and series models for better visual representation
- TMDB Service: Dedicated service for centralized TMDB API integration
- Cover Management: New endpoint to update streaming type covers with TMDB data
- Enhanced Genre Search: Method to find genre IDs by name for improved filtering
  - Route `byGenre` in `movieRoutes.ts` to fetch movies by genre.
- Method `findByGenreName` in `StreamingTypeRepository` to find genre id by name.

### Changed
- Pagination Parameters: Updated findAll methods across controllers to receive pagination parameters
- Sorting Improvement: Refactored movie and series retrieval to sort by release date
- Code Structure: Standardized error and success messages across the application
- Test Coverage: Extended test coverage for new features and repositories
- Movie Retrieval: Refactored movie retrieval to sort by release date and updated route method for genre filtering

### Fixed
- TMDB Integration: Improved error handling in TMDB API calls
- Validation: Enhanced validation for required fields in models
- Streaming History: Fixed issues with user streaming history tracking

## [1.1.0]
### Added
- Implementation of automated tests for all project
- Validation of required fields in models
- New endpoints for searching movies by genre
- Integration with movie recommendation service
- Set up Docker environment
- Standardize messages and errors messages

### Changed
- Refactoring of the movie controller for better performance
- Update of project dependencies
  
### Fixed
- Bug fix in movie results
- Fix user register return
- Validation error fix when creating new users
  
## [1.0.0] - 2024-12-15
### Added
- Basic CRUD operations for movies
- User streaming history tracking
- TMDB integration
- Streaming type categorization
- Error handling and logging
- Swagger documentation

### Breaking Changes
- Initial release