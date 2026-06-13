# Requirements Document

## Introduction

This document covers the **Likes and Comments** feature for Connectify — a social media platform built with Node.js/Express/Prisma on the backend and Flutter on the frontend.

The feature enables authenticated users to:
- **Like / unlike** posts (toggle, idempotent)
- **Comment** on posts (create, read, update, delete)
- **Reply** to comments (one level of threading)
- View **paginated lists** of likes (who liked) and comments
- Receive **in-app notifications** when another user likes or comments on their post
- See **live counter updates** on the Flutter UI (likes_count, comments_count denormalised on Post)

The backend extends the existing Prisma schema with two new models (`Like`, `Comment`) and exposes REST endpoints under `/api/likes` and `/api/comments`. The existing `Post.likes_count` and `Post.comments_count` counter fields are kept in sync transactionally. The notification service is triggered as a side effect but must not block the primary operation.

---

## Glossary

- **Like_Service**: The backend service layer responsible for like/unlike business logic.
- **Like_Repository**: The Prisma data-access layer for Like records.
- **Like_Controller**: The Express request handler for like endpoints.
- **Comment_Service**: The backend service layer responsible for comment business logic.
- **Comment_Repository**: The Prisma data-access layer for Comment records.
- **Comment_Controller**: The Express request handler for comment endpoints.
- **Notification_Service**: The stub service that dispatches in-app notifications; exists at `backend/src/modules/notifications/`.
- **Post_Repository**: The existing Prisma data-access layer for Post records.
- **Like**: A join-record pairing a `User` and a `Post` with a unique constraint, recording that the user has liked the post.
- **Comment**: A text record authored by a `User` on a `Post`, optionally referencing a parent `Comment` for thread replies.
- **Toggle**: The act of creating a Like if it does not exist, or deleting it if it does, in a single atomic operation.
- **Counter_Denormalisation**: The practice of storing `likes_count` and `comments_count` on the `Post` record to avoid expensive COUNT queries on hot read paths.
- **Authenticated_User**: A user whose JWT access token has been validated by the `authenticate` middleware.
- **Post_Owner**: The `User` whose `id` matches `Post.user_id`.
- **Comment_Owner**: The `User` whose `id` matches `Comment.user_id`.
- **Reply**: A `Comment` whose `parent_id` field references another `Comment` on the same `Post`.
- **Top-Level Comment**: A `Comment` with `parent_id = null`.
- **Flutter_Like_Widget**: The heart-icon widget in the Flutter app that shows the current like state and count for a post.
- **Flutter_Comment_Sheet**: The bottom sheet in the Flutter app that displays and allows creation of comments for a post.

---

## Requirements

---

### Requirement 1: Prisma Schema — Like Model

**User Story:** As a backend developer, I want a `Like` model in the Prisma schema, so that like records can be persisted and queried efficiently.

#### Acceptance Criteria

1. THE Prisma_Schema SHALL define a `Like` model with fields: `id` (String, primary key, `@default(uuid())`), `user_id` (String, foreign key → User), `post_id` (String, foreign key → Post), and `created_at` (DateTime, `@default(now())`).
2. THE Prisma_Schema SHALL enforce a unique constraint on the combination of `user_id` and `post_id` on the `Like` model (`@@unique([user_id, post_id])`), so that a user cannot like the same post more than once.
3. THE Prisma_Schema SHALL define `onDelete: Cascade` on the `Like` → `User` relation so that all likes belonging to a deleted user are removed automatically.
4. THE Prisma_Schema SHALL define `onDelete: Cascade` on the `Like` → `Post` relation so that all likes on a deleted post are removed automatically.
5. THE Prisma_Schema SHALL add a `likes` relation field on the `User` model referencing `Like[]`.
6. THE Prisma_Schema SHALL add a `likes` relation field on the `Post` model referencing `Like[]`.
7. THE Prisma_Schema SHALL define a database index on `Like.post_id` (`@@index([post_id])`) to support efficient listing of users who liked a post.
8. IF a `Like` creation is attempted with a `user_id` or `post_id` that does not reference an existing record, THEN THE database SHALL reject the insert and no `Like` record SHALL be persisted.

---

### Requirement 2: Prisma Schema — Comment Model

**User Story:** As a backend developer, I want a `Comment` model in the Prisma schema, so that comment records can be persisted with support for one level of threaded replies.

#### Acceptance Criteria

1. THE Prisma_Schema SHALL define a `Comment` model with fields: `id` (String, primary key, `@default(uuid())`), `user_id` (String, foreign key → User), `post_id` (String, foreign key → Post), `parent_id` (String?, nullable foreign key → Comment self-relation), `body` (String, max 2000 characters), `created_at` (DateTime, `@default(now())`), and `updated_at` (DateTime, `@updatedAt`).
2. THE Prisma_Schema SHALL enforce a self-referencing relation on `Comment.parent_id` → `Comment.id` to support reply threading.
3. THE Prisma_Schema SHALL define `onDelete: Cascade` on the `Comment` → `User` relation so that all comments by a deleted user are removed automatically.
4. THE Prisma_Schema SHALL define `onDelete: Cascade` on the `Comment` → `Post` relation so that all comments on a deleted post are removed automatically.
5. IF a parent `Comment` is deleted, THEN THE Prisma_Schema SHALL cascade the delete to all child `Comment` records that reference it via `parent_id`.
6. THE Prisma_Schema SHALL add a `comments` relation field on the `User` model referencing `Comment[]`.
7. THE Prisma_Schema SHALL add a `comments` relation field on the `Post` model referencing `Comment[]`.
8. THE Prisma_Schema SHALL define a database index on `Comment.post_id` (`@@index([post_id])`) to support efficient listing of comments on a post.
9. THE Prisma_Schema SHALL define a database index on `Comment.parent_id` (`@@index([parent_id])`) to support efficient listing of replies to a comment.
10. IF a `Comment` creation is attempted with a `parent_id` that itself references a non-null `parent_id` (i.e. a reply-to-reply), THEN THE Comment_Service SHALL reject the request with HTTP 400, enforcing a maximum threading depth of one level.

---

### Requirement 3: Like Toggle API

**User Story:** As an authenticated user, I want to like or unlike a post with a single endpoint call, so that the UI can toggle my like state without tracking it client-side.

#### Acceptance Criteria

1. THE Like_Service SHALL expose a toggle operation that accepts `userId` and `postId`.
2. WHEN the `Like` record for the given `userId` and `postId` does not exist, THE Like_Service SHALL create it and return `{ liked: true, likes_count: <number> }`.
3. WHEN the `Like` record for the given `userId` and `postId` already exists, THE Like_Service SHALL delete it and return `{ liked: false, likes_count: <number> }`.
4. THE Like_Service SHALL perform the Like creation or deletion and the corresponding `Post.likes_count` increment or decrement atomically, so that the counter remains consistent with the actual Like records.
5. IF the `postId` does not correspond to an existing, non-deleted `Post`, THEN THE Like_Controller SHALL return HTTP 404 with a not-found error message.
6. WHEN the `authenticate` middleware rejects the request (absent, malformed, or expired JWT in the `Authorization: Bearer` header), THE Like_Controller SHALL return HTTP 401.
7. THE Like_Controller SHALL expose the toggle operation at `POST /api/likes/:postId`.
8. WHEN a like is created successfully, THE Like_Controller SHALL return HTTP 200 with `{ liked: true, likes_count: <number> }`.
9. WHEN a like is deleted successfully, THE Like_Controller SHALL return HTTP 200 with `{ liked: false, likes_count: <number> }`.
10. IF `userId` equals `Post.user_id`, THEN THE Like_Controller SHALL return HTTP 400 with a bad-request error message stating that users cannot like their own posts.
11. IF the atomic operation fails due to a database or transaction error, THEN THE Like_Controller SHALL return HTTP 500 with a diagnostic error message to stderr and no counter mutation SHALL be persisted.

---

### Requirement 4: Get Likers API

**User Story:** As any user, I want to see a paginated list of users who liked a post, so that I can explore who is engaging with content.

#### Acceptance Criteria

1. THE Like_Controller SHALL expose a read operation at `GET /api/likes/:postId/users`.
2. THE Like_Controller SHALL accept optional query parameters `page` (integer ≥ 1, default 1) and `limit` (integer 1–50, default 20).
3. WHEN a valid request is received, THE Like_Repository SHALL return `Like` records for the given `postId`, ordered by `created_at` descending, with the associated `user` fields `id`, `username`, and `avatar_url` included.
4. IF the `postId` does not correspond to an existing, non-deleted `Post` or is in a non-parseable format, THEN THE Like_Controller SHALL return HTTP 404 or HTTP 400 respectively.
5. WHEN a valid request is processed, THE Like_Controller SHALL return HTTP 200 with `{ users: [...], total: <number>, page: <number>, limit: <number> }`.
6. WHEN no likes exist for the post, THE Like_Controller SHALL return HTTP 200 with an empty `users` array and `total: 0`.
7. IF `page` or `limit` are provided but are non-integer, less than 1, or `limit` exceeds 50, THEN THE Like_Controller SHALL return HTTP 400.

---

### Requirement 5: Check Like Status API

**User Story:** As an authenticated user, I want to know whether I have already liked a specific post, so that the Flutter UI can render the correct like button state on load.

#### Acceptance Criteria

1. THE Like_Controller SHALL expose a read operation at `GET /api/likes/:postId/status`.
2. WHEN the `authenticate` middleware successfully validates the token, THE Like_Service SHALL query for the existence of a non-deleted `Like` record matching the caller's `userId` and the given `postId`.
3. WHEN the query completes, THE Like_Controller SHALL return HTTP 200 with `{ liked: <boolean>, likes_count: <number> }` where `likes_count` reflects only non-deleted Like records.
4. IF the `postId` does not correspond to an existing, non-deleted `Post`, THEN THE Like_Controller SHALL return HTTP 404.
5. WHEN the `authenticate` middleware rejects the request (absent, malformed, or expired JWT), THE Like_Controller SHALL return HTTP 401.
6. IF the `postId` is in a malformed format, THEN THE Like_Controller SHALL return HTTP 400.

---

### Requirement 6: Create Comment API

**User Story:** As an authenticated user, I want to post a comment on a post, so that I can engage with content and other users.

#### Acceptance Criteria

1. THE Comment_Controller SHALL expose a create operation at `POST /api/comments/:postId`.
2. THE Comment_Controller SHALL require the `authenticate` middleware on this route.
3. THE Comment_Controller SHALL accept a JSON body with field `body` (required, string, 1–1000 characters) and optional `parent_id` (string UUID).
4. IF `body` is absent or empty, THEN THE Comment_Controller SHALL return HTTP 400.
5. IF `body` exceeds 1000 characters, THEN THE Comment_Controller SHALL return HTTP 400.
6. IF `parent_id` is provided but is not a valid UUID format, THEN THE Comment_Controller SHALL return HTTP 400.
7. IF `parent_id` is a valid UUID but does not correspond to a `Comment` that belongs to `postId`, THEN THE Comment_Controller SHALL return HTTP 404.
8. THE Comment_Service SHALL perform the `Comment` creation and the `Post.comments_count` increment as a single atomic operation.
9. THE Comment_Controller SHALL return HTTP 201 with the created `Comment` object including `id`, `body`, `parent_id`, `created_at`, and the author's `id`, `username`, and `avatar_url`.
10. IF the `postId` does not correspond to an existing, non-deleted `Post`, THEN THE Comment_Controller SHALL return HTTP 404.
11. IF the `postId` is in a malformed format, THEN THE Comment_Controller SHALL return HTTP 400.
12. IF the atomic operation fails due to a database or transaction error, THEN THE Comment_Controller SHALL return HTTP 500 and no `Comment` or counter change SHALL be persisted.

---

### Requirement 7: Get Comments API

**User Story:** As any user, I want to retrieve a paginated list of top-level comments on a post, so that I can read the conversation.

#### Acceptance Criteria

1. THE Comment_Controller SHALL expose a read operation at `GET /api/comments/:postId`.
2. THE Comment_Controller SHALL accept optional query parameters `page` (integer ≥ 1, default 1) and `limit` (integer 1–50, default 20).
3. WHEN a valid request is received, THE Comment_Repository SHALL return only Top-Level Comment records (where `parent_id IS NULL`) for the given `postId`, ordered by `created_at` descending, including the author's `id`, `username`, and `avatar_url`; IF the comment's author has been deleted, those author fields SHALL be `null`.
4. WHEN a valid request is processed, THE Comment_Controller SHALL return HTTP 200 with `{ comments: [...], total: <number>, page: <number>, limit: <number> }`.
5. WHEN no top-level comments exist, THE Comment_Controller SHALL return HTTP 200 with an empty `comments` array and `total: 0`.
6. IF the `postId` does not correspond to an existing, non-deleted `Post`, THEN THE Comment_Controller SHALL return HTTP 404.
7. IF `page` or `limit` are provided but are non-integer, less than 1, or `limit` exceeds 50, THEN THE Comment_Controller SHALL return HTTP 400.

---

### Requirement 8: Get Replies API

**User Story:** As any user, I want to retrieve replies to a specific comment, so that I can read threaded conversations.

#### Acceptance Criteria

1. THE Comment_Controller SHALL expose a read operation at `GET /api/comments/:postId/replies/:commentId`.
2. THE Comment_Controller SHALL accept optional query parameters `page` (integer ≥ 1, default 1) and `limit` (integer 1–50, default 20).
3. WHEN a valid request is received, THE Comment_Repository SHALL return `Comment` records where `parent_id` equals `commentId`, ordered by `created_at` ascending, including the author's `id`, `username`, and `avatar_url`.
4. IF the parent `commentId` does not exist or does not belong to `postId`, THEN THE Comment_Controller SHALL return HTTP 404.
5. WHEN a valid request is processed, THE Comment_Controller SHALL return HTTP 200 with `{ replies: [...], total: <number>, page: <number>, limit: <number> }` where `total` is the total count of replies for that `commentId`.
6. WHEN no replies exist for the comment, THE Comment_Controller SHALL return HTTP 200 with an empty `replies` array and `total: 0`.
7. IF `page` or `limit` are provided but are non-integer, less than 1, or `limit` exceeds 50, THEN THE Comment_Controller SHALL return HTTP 400.

---

### Requirement 9: Update Comment API

**User Story:** As an authenticated user, I want to edit my own comment, so that I can correct mistakes or update my thoughts.

#### Acceptance Criteria

1. THE Comment_Controller SHALL expose an update operation at `PUT /api/comments/:commentId`.
2. WHEN a request lacking a valid JWT arrives at this route, THE Comment_Controller SHALL return HTTP 401.
3. IF the `body` field is absent, empty, or exceeds 1000 characters, THEN THE Comment_Controller SHALL return HTTP 400.
4. THE Comment_Service SHALL verify that the `Comment` exists; IF it does not, THEN THE Comment_Controller SHALL return HTTP 404.
5. THE Comment_Service SHALL verify that `Comment.user_id` equals the caller's `userId`; IF it does not, THEN THE Comment_Controller SHALL return HTTP 403.
6. WHEN ownership is confirmed, THE Comment_Service SHALL update `Comment.body` and set `Comment.updated_at` to the current server timestamp.
7. WHEN the update completes successfully, THE Comment_Controller SHALL return HTTP 200 with the updated `Comment` object including the new `body` and `updated_at` values.

---

### Requirement 10: Delete Comment API

**User Story:** As an authenticated user, I want to delete my own comment, so that I can remove content I no longer want visible.

#### Acceptance Criteria

1. THE Comment_Controller SHALL expose a delete operation at `DELETE /api/comments/:commentId`.
2. THE Comment_Controller SHALL require the `authenticate` middleware on this route.
3. IF the `commentId` path parameter is in a malformed format, THEN THE Comment_Controller SHALL return HTTP 400.
4. THE Comment_Service SHALL verify that the `Comment` exists; IF it does not, THEN THE Comment_Controller SHALL return HTTP 404.
5. THE Comment_Service SHALL verify that `Comment.user_id` equals the caller's `userId`; IF it does not, THEN THE Comment_Controller SHALL return HTTP 403.
6. WHEN the comment to delete is a top-level comment (where `parent_id` is null), THE Comment_Service SHALL delete the comment and all its child replies atomically, then decrement `Post.comments_count` by the total count of deleted records (parent + replies) in the same operation.
7. WHEN the comment to delete is a reply (where `parent_id` is not null), THE Comment_Service SHALL delete only that single reply record and decrement `Post.comments_count` by exactly 1 in the same atomic operation.
8. WHEN deletion completes successfully, THE Comment_Controller SHALL return HTTP 200 with a success message.

---

### Requirement 11: Counter Denormalisation Consistency

**User Story:** As a developer, I want `Post.likes_count` and `Post.comments_count` to accurately reflect the number of Like and Comment records at all times, so that the API can return counts cheaply without aggregation queries.

#### Acceptance Criteria

1. WHEN a `Like` is created, THE Like_Service SHALL increment `Post.likes_count` by 1 in the same atomic operation.
2. WHEN a `Like` is deleted, THE Like_Service SHALL decrement `Post.likes_count` by 1 in the same atomic operation.
3. WHEN a `Comment` is created, THE Comment_Service SHALL increment `Post.comments_count` by 1 in the same atomic operation.
4. WHEN one or more `Comment` records are deleted (including cascaded replies), THE Comment_Service SHALL decrement `Post.comments_count` by the exact count of deleted records in the same atomic operation.
5. IF a `Post.likes_count` decrement would produce a value less than 0, THEN THE Like_Service SHALL set `Post.likes_count` to 0 instead.
6. IF a `Post.comments_count` decrement would produce a value less than 0, THEN THE Comment_Service SHALL set `Post.comments_count` to 0 instead.
7. AFTER any sequence of like-toggle operations on a post, IF the total number of successful like creations minus successful like deletions equals N, THEN `Post.likes_count` SHALL equal N.
8. AFTER any sequence of comment-create and comment-delete operations on a post, IF the total number of non-deleted `Comment` records for that post equals M, THEN `Post.comments_count` SHALL equal M.
9. IF the atomic counter update fails, THEN THE service SHALL roll back the entire operation (no Like/Comment record written, no counter changed) and return HTTP 500.

---

### Requirement 12: Authentication Enforcement

**User Story:** As a system operator, I want all write operations on likes and comments to require a valid JWT, so that only authenticated users can engage with posts.

#### Acceptance Criteria

1. THE Like_Controller SHALL apply the `authenticate` middleware to `POST /api/likes/:postId`.
2. THE Like_Controller SHALL apply the `authenticate` middleware to `GET /api/likes/:postId/status`.
3. THE Comment_Controller SHALL apply the `authenticate` middleware to `POST /api/comments/:postId`.
4. THE Comment_Controller SHALL apply the `authenticate` middleware to `PUT /api/comments/:commentId`.
5. THE Comment_Controller SHALL apply the `authenticate` middleware to `DELETE /api/comments/:commentId`.
6. WHEN a request to any `authenticate`-protected route arrives with an absent, malformed, or expired JWT in the `Authorization: Bearer` header, THE controller SHALL return HTTP 401 before invoking any service logic.
7. THE Like_Controller SHALL NOT apply the `authenticate` middleware to `GET /api/likes/:postId/users`.
8. THE Comment_Controller SHALL NOT apply the `authenticate` middleware to `GET /api/comments/:postId` or `GET /api/comments/:postId/replies/:commentId`.

---

### Requirement 13: Notification Triggers

**User Story:** As a post owner, I want to receive an in-app notification when another user likes or comments on my post, so that I am aware of engagement on my content.

#### Acceptance Criteria

1. WHEN a `Like` is created and the liker's `userId` does not equal `Post.user_id`, THE system SHALL dispatch a `LIKE` notification to the post owner containing the liker's user id and the `postId`.
2. WHEN a `Comment` is created and the commenter's `userId` does not equal `Post.user_id`, THE system SHALL dispatch a `COMMENT` notification to the post owner containing the commenter's user id, the `postId`, and the `commentId`.
3. WHEN a `Comment` is a reply and the replier's `userId` does not equal the parent comment owner's `userId`, THE system SHALL dispatch a `REPLY` notification to the parent comment owner containing the replier's user id, the `postId`, and the `commentId`.
4. Notifications SHALL be dispatched after the primary transaction commits, so that a dispatch failure cannot roll back the like or comment operation.
5. IF the notification dispatch fails, THEN THE system SHALL retry up to 3 times before logging the error and discarding the notification without propagating the failure to the API caller.
6. WHEN the same actor performs the same event (like/comment) on the same post more than once within 60 seconds, THE system SHALL not dispatch duplicate notifications to the post owner.

---

### Requirement 14: Route Registration

**User Story:** As a backend developer, I want the like and comment routes registered in the central router, so that all endpoints are reachable under the `/api` prefix.

#### Acceptance Criteria

1. THE Routes_Index (`backend/src/routes/index.js`) SHALL import the Like router from `../modules/likes/like.routes` and mount it at `/likes`, making all like endpoints reachable under `/api/likes`.
2. THE Routes_Index SHALL import the Comment router from `../modules/comments/comment.routes` and mount it at `/comments`, making all comment endpoints reachable under `/api/comments`.
3. WHEN the server starts, `GET /api/health`, `GET /api/likes/:postId/users`, and `GET /api/comments/:postId` SHALL all return HTTP 200 or HTTP 404 (not HTTP 404 due to unregistered router), confirming all three mounts are active.

---

### Requirement 15: Flutter — Like UI

**User Story:** As a Flutter developer, I want a like widget on each post card, so that users can toggle their like state and see the current like count with immediate visual feedback.

#### Acceptance Criteria

1. THE Flutter_Like_Widget SHALL display a heart icon in two states — filled (red) when the post is liked, outlined (grey) when it is not — alongside the `likes_count` value from post data.
2. WHEN the user taps the heart icon, THE Flutter_Like_Widget SHALL optimistically toggle the icon state and adjust `likes_count` by ±1 before the API response returns, then call `POST /api/likes/:postId`.
3. WHEN the API response is received, THE Flutter_Like_Widget SHALL update `likes_count` with the `likes_count` value from the response payload.
4. IF the API call fails, THE Flutter_Like_Widget SHALL revert the optimistic toggle and display an error snackbar for 3 seconds.
5. WHEN a post card is rendered for an authenticated user, THE Flutter_Like_Widget SHALL call `GET /api/likes/:postId/status` to determine the initial liked state.
6. WHILE the like toggle request is in flight, THE Flutter_Like_Widget SHALL disable the tap handler to prevent duplicate requests.
7. IF the initial status fetch (`GET /api/likes/:postId/status`) fails, THEN THE Flutter_Like_Widget SHALL default to the outlined (not liked) state and retain the `likes_count` from the post data.
8. WHEN the widget is rendered for an unauthenticated user and they tap the heart icon, THE Flutter_Like_Widget SHALL not call the API and SHALL display an error snackbar prompting the user to log in.

---

### Requirement 16: Flutter — Comment UI

**User Story:** As a Flutter developer, I want a comment bottom sheet on each post, so that users can read, write, and interact with comments and replies.

#### Acceptance Criteria

1. WHEN the user taps the comment icon on a post card, THE Flutter_Comment_Sheet SHALL open as a bottom sheet.
2. WHEN the sheet opens, THE Flutter_Comment_Sheet SHALL call `GET /api/comments/:postId?page=1&limit=20` and display the returned top-level comments.
3. WHEN the user scrolls within 100px of the bottom of the comment list and more pages exist, THE Flutter_Comment_Sheet SHALL load the next page and append the results to the list.
4. THE Flutter_Comment_Sheet SHALL display each comment with the author's avatar, username, comment body, and a relative timestamp formatted as `Xm`, `Xh`, or `Xd` ago.
5. THE Flutter_Comment_Sheet SHALL display a text input field fixed at the bottom of the sheet for composing new comments, with a maximum input length of 500 characters.
6. WHEN the authenticated user submits a non-empty comment, THE Flutter_Comment_Sheet SHALL call `POST /api/comments/:postId` and prepend the returned comment to the top of the comment list on success.
7. WHEN the user taps a "Reply" button on a comment, THE Flutter_Comment_Sheet SHALL switch the text input into reply mode showing `@username` as a reply indicator, and on submission SHALL call `POST /api/comments/:postId` with the `parent_id` of the tapped comment.
8. WHEN the authenticated comment owner long-presses their own comment, THE Flutter_Comment_Sheet SHALL show a context menu with a "Delete" option; WHEN selected, it SHALL call `DELETE /api/comments/:commentId` and remove the item from the list on success.
9. WHEN the authenticated comment owner long-presses their own comment, THE Flutter_Comment_Sheet SHALL show a context menu with an "Edit" option; WHEN selected, it SHALL populate the text input with the existing `body`, and on submission SHALL call `PUT /api/comments/:commentId` and update the item in the list on success.
10. WHEN the local `comments_count` changes (after a successful create or delete), THE Flutter_Comment_Sheet SHALL notify the parent post card to update its displayed comment count without a full page reload.
11. IF any API call (fetch, create, delete, edit) fails, THE Flutter_Comment_Sheet SHALL display an error snackbar for 3 seconds and leave the comment list unchanged.
12. IF the initial comments fetch fails, THE Flutter_Comment_Sheet SHALL display an error message inside the sheet with a retry button.
