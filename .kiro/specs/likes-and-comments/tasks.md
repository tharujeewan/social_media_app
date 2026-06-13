# Implementation Plan: Likes and Comments

## Overview

This task list implements the **Likes and Comments** feature for Connectify, enabling users to like/unlike posts (idempotent toggle), comment on posts, and reply to comments (one level deep). The implementation spans backend (Node.js/Express/Prisma) and frontend (Flutter), with atomic counter denormalization and post-commit notification dispatch.

**Key patterns:**
- Backend: `controller → service → repository` with Joi validation and JWT authentication
- Frontend: `provider` state management pattern with optimistic UI updates
- Testing: Jest unit tests + fast-check property-based tests + Flutter widget tests

---

## Tasks

- [x] 1. Create spec config file
  - Create `.config.kiro` in `.kiro/specs/likes-and-comments/` with specId, workflowType, and specType
  - _Requirements: Workflow prerequisite_

- [x] 2. Update Prisma schema and run migration
  - [x] 2.1 Add Like model with fields, relations, and indexes
    - Add `Like` model with `id`, `user_id`, `post_id`, `created_at`
    - Add unique constraint on `[user_id, post_id]`
    - Add cascade delete on User and Post relations
    - Add index on `post_id`
    - Add `likes` relation field on `User` and `Post` models
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 2.2 Add Comment model with fields, relations, and indexes
    - Add `Comment` model with `id`, `user_id`, `post_id`, `parent_id`, `body`, `created_at`, `updated_at`
    - Add self-referencing relation for `parent_id` with cascade delete
    - Add cascade delete on User and Post relations
    - Add indexes on `post_id` and `parent_id`
    - Add `comments` relation field on `User` and `Post` models
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 2.3 Run Prisma migration
    - Execute `npx prisma migrate dev --name add_likes_and_comments`
    - _Requirements: 1.1, 2.1_

- [x] 3. Implement Like module backend
  - [x] 3.1 Implement LikeRepository
    - Implement `findOne(userId, postId)` for upsert-style toggle
    - Implement `findByPostId(postId, { skip, take })` with user join and count
    - Implement `deleteOne(userId, postId)` for deleting likes
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

  - [x] 3.2 Implement LikeService with toggle logic
    - Implement `toggleLike(userId, postId)` with atomic transaction
    - Check post existence and throw NotFoundError if not found
    - Reject self-likes with BadRequestError
    - Use Prisma transaction for Like create/delete + counter increment/decrement
    - Apply floor guard (counter ≥ 0) using conditional update
    - Return `{ liked, likes_count }` after transaction commits
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.10, 3.11, 11.1, 11.2, 11.5, 11.7_

  - [ ]* 3.3 Write property test for Like toggle round-trip
    - **Property 2: Like toggle round-trip (counter consistency)**
    - **Validates: Requirements 3.2, 3.3, 3.4, 11.1, 11.2, 11.7**
    - Test that `Post.likes_count` equals actual `Like` count after arbitrary toggle sequences
    - Use fast-check with array of boolean operations (100+ iterations)

  - [ ]* 3.4 Write property test for Like toggle idempotence
    - **Property 3: Like toggle idempotence**
    - **Validates: Requirements 3.2, 3.3**
    - Test that two consecutive toggles (like then unlike) return post to original state
    - Verify no Like record remains in database

  - [x] 3.5 Implement LikeService getLikers and status methods
    - Implement `getLikers(postId, { page, limit })` with pagination
    - Implement `getLikeStatus(userId, postId)` returning `{ liked, likes_count }`
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 5.1, 5.2, 5.3_

  - [ ]* 3.6 Write unit tests for LikeService
    - Test toggle creates Like when none exists
    - Test toggle deletes Like when it exists
    - Test rejection when user likes own post (HTTP 400)
    - Test NotFoundError for non-existent post
    - Test getLikeStatus returns correct state
    - Test getLikers pagination and user data

  - [x] 3.7 Implement LikeController handlers
    - Implement `toggleLike` handler at `POST /api/likes/:postId`
    - Implement `getLikers` handler at `GET /api/likes/:postId/users`
    - Implement `getLikeStatus` handler at `GET /api/likes/:postId/status`
    - Use `success()` response helper from `utils/response`
    - Apply proper error handling with `next(err)`
    - _Requirements: 3.7, 3.8, 3.9, 4.1, 4.2, 4.5, 5.1, 5.3_

  - [x] 3.8 Implement like.validation.js with Joi schemas
    - Define `postIdParamSchema` for UUID validation
    - Define `likePaginationSchema` with page (≥1, default 1) and limit (1-50, default 20)
    - _Requirements: 4.2, 4.7, 5.6_

  - [x] 3.9 Implement like.routes.js with middleware
    - Apply `authenticate` middleware to `POST /api/likes/:postId` and `GET /api/likes/:postId/status`
    - Apply `validate` middleware to all routes with appropriate schemas
    - Leave `GET /api/likes/:postId/users` as public (no auth)
    - _Requirements: 3.6, 3.7, 4.1, 5.1, 12.1, 12.2, 12.7_

  - [x] 3.10 Create like.dto.js
    - Implement `sanitizeLike(like)` returning `{ userId, username, avatar_url, likedAt }`
    - _Requirements: 4.3_

- [x] 4. Implement Comment module backend
  - [x] 4.1 Implement CommentRepository
    - Implement `findById(commentId)` with user join
    - Implement `findTopLevelByPostId(postId, { skip, take })` where `parent_id IS NULL`
    - Implement `findRepliesByParentId(parentId, { skip, take })` ordered by `created_at` ASC
    - Implement `countReplies(parentId)` for cascade delete calculation
    - Implement `create`, `update`, and `delete` operations
    - _Requirements: 6.1, 6.2, 7.1, 7.3, 8.1, 8.3, 9.1, 10.1_

  - [x] 4.2 Implement CommentService createComment with depth guard
    - Implement `createComment(userId, postId, { body, parent_id })`
    - Validate post existence (NotFoundError if not found)
    - If `parent_id` provided, validate parent exists and belongs to same post
    - Enforce max reply depth of 1 (reject reply-to-reply with BadRequestError)
    - Use Prisma transaction for Comment create + `Post.comments_count` increment
    - Return sanitized comment with user data
    - _Requirements: 2.10, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 11.3_

  - [ ]* 4.3 Write property test for reply depth enforcement
    - **Property 4: Reply depth enforcement**
    - **Validates: Requirements 2.10**
    - Test that attempting to create a reply to a reply throws BadRequestError
    - Verify no Comment record is created

  - [x] 4.3 Implement CommentService read operations
    - Implement `getComments(postId, { page, limit })` returning top-level comments only
    - Implement `getReplies(postId, commentId, { page, limit })`
    - Validate post and parent comment existence
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 4.4 Write property test for top-level comments filtering
    - **Property 6: Get comments returns only top-level records**
    - **Validates: Requirements 7.3**
    - Test that `getComments` returns only comments with `parent_id = null`

  - [ ]* 4.5 Write property test for replies filtering
    - **Property 7: Get replies returns only children of requested comment**
    - **Validates: Requirements 8.3**
    - Test that all returned replies have `parent_id = commentId`

  - [x] 4.6 Implement CommentService update and delete with ownership checks
    - Implement `updateComment(userId, commentId, { body })` with ownership verification
    - Implement `deleteComment(userId, commentId)` with cascade delete logic
    - For top-level comment delete: count replies, delete parent (cascade deletes children), decrement counter by (replies + 1)
    - For reply delete: delete single record, decrement counter by 1
    - Apply floor guard (counter ≥ 0)
    - Throw ForbiddenError if caller doesn't own comment
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 11.4, 11.6, 11.8_

  - [ ]* 4.7 Write property test for comment counter consistency
    - **Property 5: Comment counter consistency**
    - **Validates: Requirements 6.8, 10.6, 10.7, 11.3, 11.4, 11.8**
    - Test that `Post.comments_count` equals actual `Comment` count after create/delete sequences
    - Include cascaded reply deletions in test scenarios

  - [ ]* 4.8 Write property test for update ownership enforcement
    - **Property 8: Comment ownership — non-owner cannot update**
    - **Validates: Requirements 9.5**
    - Test that non-owner update throws ForbiddenError and body remains unchanged

  - [ ]* 4.9 Write property test for delete ownership enforcement
    - **Property 9: Comment ownership — non-owner cannot delete**
    - **Validates: Requirements 10.5**
    - Test that non-owner delete throws ForbiddenError and no records are deleted

  - [ ]* 4.10 Write unit tests for CommentService
    - Test top-level comment creation succeeds
    - Test reply creation succeeds
    - Test reply-to-reply is rejected (depth > 1)
    - Test empty body is rejected
    - Test body > 1000 chars is rejected
    - Test update fails with 403 for non-owner
    - Test delete top-level comment decrements by (replies + 1)
    - Test delete reply decrements by 1

  - [x] 4.11 Implement CommentController handlers
    - Implement `createComment` handler at `POST /api/comments/:postId`
    - Implement `getComments` handler at `GET /api/comments/:postId`
    - Implement `getReplies` handler at `GET /api/comments/:postId/replies/:commentId`
    - Implement `updateComment` handler at `PUT /api/comments/:commentId`
    - Implement `deleteComment` handler at `DELETE /api/comments/:commentId`
    - Use `success()` response helper and proper status codes (201 for create)
    - _Requirements: 6.1, 6.9, 7.1, 7.4, 8.1, 8.5, 9.1, 9.7, 10.1, 10.8_

  - [x] 4.12 Implement comment.validation.js with Joi schemas
    - Define `createCommentSchema` with `body` (1-1000 chars) and optional `parent_id` (UUID)
    - Define `updateCommentSchema` with `body` (1-1000 chars)
    - Define param schemas for `postId`, `commentId`, and combined `postId + commentId`
    - Define `commentPaginationSchema` with page and limit validation
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 7.2, 7.7, 8.2, 8.7, 9.3_

  - [x] 4.13 Implement comment.routes.js with middleware
    - Apply `authenticate` middleware to POST, PUT, DELETE routes
    - Apply `validate` middleware to all routes with appropriate schemas
    - Leave GET routes public (no auth)
    - _Requirements: 6.2, 7.1, 8.1, 9.2, 10.2, 12.3, 12.4, 12.5, 12.8_

  - [x] 4.14 Create comment.dto.js
    - Implement `sanitizeComment(comment)` returning `{ id, body, parent_id, created_at, updated_at, user: {id, username, avatar_url} }`
    - Handle cases where user is deleted (set user fields to null)
    - _Requirements: 6.9, 7.3_

- [x] 5. Implement notification integration
  - [x] 5.1 Implement NotificationService dispatch methods
    - Implement `dispatchLikeNotification(actorId, postId, recipientId)` with retry logic
    - Implement `dispatchCommentNotification(actorId, postId, commentId, recipientId)` with retry logic
    - Implement `dispatchReplyNotification(actorId, postId, commentId, recipientId)` with retry logic
    - Add exponential backoff retry (max 3 attempts, 200ms * attempt)
    - Implement deduplication using in-memory TTL cache (60-second window)
    - Log errors to stderr but don't propagate to caller
    - _Requirements: 13.1, 13.2, 13.3, 13.5, 13.6_

  - [x] 5.2 Integrate notification dispatch into LikeService
    - After successful Like creation, dispatch `LIKE` notification via `setImmediate`
    - Skip dispatch if actor equals post owner
    - Wrap dispatch in try-catch to prevent propagation
    - _Requirements: 13.1, 13.4_

  - [x] 5.3 Integrate notification dispatch into CommentService
    - After Comment creation, dispatch `COMMENT` notification if actor ≠ post owner
    - If parent comment exists, dispatch `REPLY` notification if actor ≠ parent owner
    - Use `setImmediate` for post-commit dispatch
    - _Requirements: 13.2, 13.3, 13.4_

  - [ ]* 5.4 Write unit tests for NotificationService
    - Test no dispatch when actor is post owner
    - Test retry logic up to 3 attempts
    - Test deduplication within 60-second window
    - Test error logging without propagation

- [x] 6. Register routes in central router
  - [x] 6.1 Mount Like and Comment routers in routes/index.js
    - Import `like.routes.js` and mount at `/likes`
    - Import `comment.routes.js` and mount at `/comments`
    - Verify all endpoints are reachable under `/api` prefix
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 7. Checkpoint - Backend implementation complete
  - Ensure all tests pass
  - Verify Prisma migration applied successfully
  - Test all endpoints manually or via Postman/curl
  - Ask the user if questions arise

- [ ] 8. Implement Flutter Like UI
  - [-] 8.1 Create like_status_model.dart
    - Define `LikeStatusModel` with `liked` (bool) and `likesCount` (int)
    - Add `fromJson` and `toJson` methods
    - _Requirements: 15.1_

  - [~] 8.2 Implement LikeApiService in post_service.dart
    - Add `toggleLike(postId)` → `POST /api/likes/:postId`
    - Add `getLikeStatus(postId)` → `GET /api/likes/:postId/status`
    - Use `ApiClient` singleton with Dio and Bearer token interceptor
    - _Requirements: 15.2, 15.5_

  - [~] 8.3 Implement LikeProvider with optimistic updates
    - Extend `ChangeNotifier` with state fields: `_liked`, `_likesCount`, `_isLoading`, `_error`
    - Implement `initFromPost(likesCount)` to initialize from Post data
    - Implement `fetchStatus()` to call `getLikeStatus` API
    - Implement `toggle()` with optimistic state update, API call, and revert on error
    - Disable toggle while `_isLoading` is true to prevent duplicate requests
    - _Requirements: 15.2, 15.3, 15.4, 15.6, 15.7_

  - [~] 8.4 Create like_button.dart widget
    - Use `Consumer<LikeProvider>` to render heart icon (filled red vs outlined grey)
    - Display `likesCount` next to icon
    - Handle tap with authentication check (show snackbar if unauthenticated)
    - Show error snackbar for 3 seconds on API failure
    - _Requirements: 15.1, 15.2, 15.4, 15.8_

  - [ ]* 8.5 Write Flutter widget tests for LikeProvider
    - Test `fetchStatus` sets `liked` and `likesCount` from API response
    - Test `toggle` applies optimistic update before API call
    - Test `toggle` reverts on API error
    - Test `toggle` is no-op when `isLoading` is true

- [ ] 9. Implement Flutter Comment UI
  - [-] 9.1 Create comment_model.dart
    - Define `CommentModel` with `id`, `body`, `parentId`, `createdAt`, `updatedAt`, `user` (nested UserModel)
    - Add `fromJson` and `toJson` methods
    - _Requirements: 16.2, 16.4_

  - [~] 9.2 Implement CommentApiService in post_service.dart
    - Add `getComments(postId, page, limit)` → `GET /api/comments/:postId`
    - Add `createComment(postId, body, parentId)` → `POST /api/comments/:postId`
    - Add `updateComment(commentId, body)` → `PUT /api/comments/:commentId`
    - Add `deleteComment(commentId)` → `DELETE /api/comments/:commentId`
    - Use `ApiClient` singleton with authentication
    - _Requirements: 16.2, 16.6, 16.8, 16.9_

  - [~] 9.3 Implement CommentProvider with pagination and reply mode
    - Extend `ChangeNotifier` with state: `_comments`, `_isLoading`, `_isFetchingMore`, `_hasMore`, `_page`, `_total`, `_error`
    - Add reply mode state: `_replyToCommentId`, `_replyToUsername`
    - Implement `fetchComments({ refresh })` to load initial page
    - Implement `loadMore()` for pagination (triggered when scroll < 100px from bottom)
    - Implement `addComment(body)` with prepend to list and call `onCountChanged`
    - Implement `deleteComment(commentId)` with removal from list
    - Implement `editComment(commentId, body)` with in-place update
    - Implement `enterReplyMode(commentId, username)` and `exitReplyMode()`
    - Add `onCountChanged` callback for notifying parent
    - _Requirements: 16.2, 16.3, 16.6, 16.7, 16.8, 16.9, 16.10_

  - [~] 9.4 Create comment_sheet.dart widget
    - Use `DraggableScrollableSheet` inside `showModalBottomSheet`
    - Create scoped `CommentProvider` via `ChangeNotifierProvider`
    - Call `fetchComments()` on init
    - Use `ListView.builder` with `ScrollController` to detect scroll position for `loadMore()`
    - Display each comment with avatar, username, body, relative timestamp
    - Show fixed `TextField` at bottom with max length 500 chars
    - Switch input to reply mode showing `@username` when "Reply" tapped
    - Show context menu on long-press for own comments with "Edit" and "Delete" options
    - Display error snackbar (3 seconds) on API failures
    - Show inline error widget with retry button on initial fetch failure
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10, 16.11, 16.12_

  - [ ] 9.5 Implement formatRelative() utility function
    - Add `formatRelative(DateTime dt)` in a utils file
    - Return `Xm` for diff < 60 minutes, `Xh` for < 24 hours, `Xd` otherwise
    - _Requirements: 16.4_

  - [ ]* 9.6 Write property test for formatRelative
    - **Property 10: Relative timestamp formatting covers all ranges**
    - **Validates: Requirements 16.4**
    - Test that output matches pattern `^\d+[mhd]$` for all past DateTime values
    - Test boundary conditions (59m → 1h, 23h → 1d)

  - [ ]* 9.7 Write Flutter widget tests for CommentProvider
    - Test `fetchComments` populates list and sets `total`
    - Test `addComment` prepends to list
    - Test `deleteComment` removes from list
    - Test `editComment` updates body in list
    - Test `enterReplyMode` sets reply state correctly

- [~] 10. Final integration checkpoint
  - Ensure all backend and frontend tests pass
  - Test end-to-end flow: like/unlike, comment create/delete, reply, edit
  - Verify counter consistency across multiple operations
  - Verify notifications dispatch correctly (check logs)
  - Ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property-based tests validate universal correctness properties across the input space
- Unit tests validate specific examples and error conditions
- Backend uses Prisma transactions for atomic counter updates
- Frontend uses optimistic UI updates with revert-on-error for responsiveness
- Notification dispatch is post-commit (setImmediate) to prevent rollback on failure
- All routes follow existing middleware pattern: `authenticate` → `validate` → controller
- Counter floor guards (≥ 0) prevent negative counts due to race conditions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["3.1", "4.1", "3.10", "4.14"] },
    { "id": 4, "tasks": ["3.2", "3.8", "4.2"] },
    { "id": 5, "tasks": ["3.3", "3.4", "4.3", "3.5", "4.12"] },
    { "id": 6, "tasks": ["3.6", "4.4", "4.5", "4.6"] },
    { "id": 7, "tasks": ["3.7", "3.9", "4.7", "4.8", "4.9", "4.10"] },
    { "id": 8, "tasks": ["4.11", "4.13", "5.1"] },
    { "id": 9, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 10, "tasks": ["6.1"] },
    { "id": 11, "tasks": ["8.1", "9.1"] },
    { "id": 12, "tasks": ["8.2", "9.2", "9.5"] },
    { "id": 13, "tasks": ["8.3", "9.3"] },
    { "id": 14, "tasks": ["8.4", "9.4"] },
    { "id": 15, "tasks": ["8.5", "9.6", "9.7"] }
  ]
}
```
