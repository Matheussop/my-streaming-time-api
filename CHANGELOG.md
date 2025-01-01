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