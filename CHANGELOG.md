# Changelog

## [Unreleased]
### Added
- PATCH `/api/boards/:id` – partial update of board metadata (title, isPublic, archived, tags).
  - Added `PatchBoardSchema` for request validation.
  - Added `updateBoardMeta` service function.
  - Updated API reference in README.
