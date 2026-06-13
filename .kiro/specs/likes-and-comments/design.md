# Design Document — Likes and Comments

## Overview

This document describes the technical design for the **Likes and Comments** feature of Connectify.
The feature adds social engagement to posts: authenticated users can like/unlike posts (idempotent toggle), comment on posts, and reply to comments one level deep. Like and comment counts are kept in sync via atomic Prisma transactions. In-app notifications are dispatched as post-commit side effects so they cannot roll back the primary operation.

**Stack recap**
- Backend: Node.js / Express, Prisma ORM (PostgreSQL)
- Frontend: Flutter (Dart), `provider` for state management, `dio` for HTTP
- Pattern: `controller → service → repository`, one folder per module
- Auth: `authenticate` JWT middleware from `auth.middleware.js`
- Validation: `validate.middleware.js` wrapping Joi schemas

---

## Architecture

```
Flutter (Connectify)
  ├── LikeProvider  ──────────────────────────────────────────────────────────┐
  └── CommentProvider  ──────────────────────────────────────────────────────┐|
                                                                              ||
  HTTP (Dio + DioInterceptor → Bearer token)                                  ||
                                                                              ↓↓
Express App  (backend/src/app.js)
  └── /api  (backend/src/routes/index.js)
        ├── /auth        → auth.routes.js
        ├── /posts       → post.routes.js
        ├── /likes       → like.routes.js          ← NEW
        ├── /comments    → comment.routes.js        ← NEW
        └── /upload      → upload.routes.js

  Like Module (backend/src/modules/likes/)
  ┌─────────────────────────────────────────────────────────────┐
  │  like.routes.js                                              │
  │    → authenticate (write routes)                            │
  │    → validate (Joi schemas)                                  │
  │    → LikeController                                          │
  │         → LikeService                                        │
  │              → LikeRepository   (Prisma)                    │
  │              → PostRepository   (counter updates)           │
  │              → NotificationService  (post-commit side-effect)│
  └─────────────────────────────────────────────────────────────┘

  Comment Module (backend/src/modules/comments/)
  ┌─────────────────────────────────────────────────────────────┐
  │  comment.routes.js                                           │
  │    → authenticate (write routes)                            │
  │    → validate (Joi schemas)                                  │
  │    → CommentController                                       │
  │         → CommentService                                     │
  │              → CommentRepository  (Prisma)                  │
  │              → PostRepository     (counter updates)         │
  │              → NotificationService (post-commit side-effect)│
  └─────────────────────────────────────────────────────────────┘

  Shared
  ├── NotificationService   (backend/src/modules/notifications/)
  ├── PostRepository        (backend/src/modules/posts/)
  ├── errors.js             (NotFoundError, ForbiddenError, BadRequestError, …)
  └── response.js           (success(), error())
```

---

## Prisma Schema Changes

Add the following to `backend/prisma/schema.prisma`. Also update the existing `User` and `Post` models with the new relation fields marked below.

```prisma
// ── Like ──────────────────────────────────────────────────────────────────
model Like {
  id         String   @id @default(uuid())
  user_id    String
  post_id    String
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  post Post @relation(fields: [post_id], references: [id], onDelete: Cascade)

  @@unique([user_id, post_id])
  @@index([post_id])
  @@map("likes")
}

// ── Comment ───────────────────────────────────────────────────────────────
model Comment {
  id         String   @id @default(uuid())
  user_id    String
  post_id    String
  parent_id  String?
  body       String   @db.VarChar(2000)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  user    User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  post    Post      @relation(fields: [post_id], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentReplies", fields: [parent_id], references: [id], onDelete: Cascade)
  replies Comment[] @relation("CommentReplies")

  @@index([post_id])
  @@index([parent_id])
  @@map("comments")
}
```

**Additions to existing models:**

```prisma
model User {
  // … existing fields …
  likes    Like[]     // ← add
  comments Comment[]  // ← add
}

model Post {
  // … existing fields …
  likes    Like[]     // ← add
  comments Comment[]  // ← add
}
```

**Migration command:**
```bash
npx prisma migrate dev --name add_likes_and_comments
```

---

## API Endpoint Table

All routes are prefixed with `/api`.

### Like Endpoints

| Method | Path | Auth | Request | Success Response |
|--------|------|------|---------|-----------------|
| `POST` | `/likes/:postId` | ✅ Required | Params: `postId` (UUID) | `200 { liked, likes_count }` |
| `GET` | `/likes/:postId/users` | ❌ Public | Params: `postId`; Query: `page`, `limit` | `200 { users: [{id, username, avatar_url}], total, page, limit }` |
| `GET` | `/likes/:postId/status` | ✅ Required | Params: `postId` | `200 { liked: boolean, likes_count }` |

### Comment Endpoints

| Method | Path | Auth | Request Body / Query | Success Response |
|--------|------|------|---------|-----------------|
| `POST` | `/comments/:postId` | ✅ Required | `{ body: string, parent_id?: UUID }` | `201 { id, body, parent_id, created_at, user: {id, username, avatar_url} }` |
| `GET` | `/comments/:postId` | ❌ Public | Query: `page`, `limit` | `200 { comments: [...], total, page, limit }` |
| `GET` | `/comments/:postId/replies/:commentId` | ❌ Public | Query: `page`, `limit` | `200 { replies: [...], total, page, limit }` |
| `PUT` | `/comments/:commentId` | ✅ Required | `{ body: string }` | `200 { id, body, updated_at, ... }` |
| `DELETE` | `/comments/:commentId` | ✅ Required | — | `200 { message }` |

### Shared Query Parameter Constraints

| Parameter | Type | Default | Constraints |
|-----------|------|---------|-------------|
| `page` | integer | 1 | ≥ 1 |
| `limit` | integer | 20 | 1–50 |

---

## Components and Interfaces

### Module Structure

Each module mirrors the existing `posts/` layout exactly.

```
backend/src/modules/
├── likes/
│   ├── like.controller.js     — Express handlers, calls LikeService, uses success()/error()
│   ├── like.service.js        — Business logic (toggle, status, likers list)
│   ├── like.repository.js     — Prisma queries for Like records
│   ├── like.routes.js         — Express Router, applies authenticate + validate middleware
│   └── like.validation.js     — Joi schemas for params and query
│
└── comments/
    ├── comment.controller.js  — Express handlers, calls CommentService, uses success()/error()
    ├── comment.service.js     — Business logic (create, update, delete, depth guard)
    ├── comment.repository.js  — Prisma queries for Comment records
    ├── comment.routes.js      — Express Router, applies authenticate + validate middleware
    └── comment.validation.js  — Joi schemas for params, body, and query
```

### DTOs

```
backend/src/dto/
├── like.dto.js     — sanitizeLike(like) → { userId, username, avatar_url, likedAt }
└── comment.dto.js  — sanitizeComment(comment) → { id, body, parent_id, created_at,
                                                     updated_at, user: {id,username,avatar_url} }
```

### Notification Service Interface

`notification.service.js` will expose three methods called by Like/Comment services:

```js
notificationService.dispatchLikeNotification(actorId, postId, ownerId)
notificationService.dispatchCommentNotification(actorId, postId, commentId, ownerId)
notificationService.dispatchReplyNotification(actorId, postId, commentId, parentCommentOwnerId)
```

All three are fire-and-forget (not awaited by the caller). Internal retry logic handles failures.

---

## Data Models

### Like (Prisma-level)

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `String` | PK, `@default(uuid())` |
| `user_id` | `String` | FK → User, Cascade delete |
| `post_id` | `String` | FK → Post, Cascade delete |
| `created_at` | `DateTime` | `@default(now())` |

Unique constraint: `@@unique([user_id, post_id])`.
Index: `@@index([post_id])`.

### Comment (Prisma-level)

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `String` | PK, `@default(uuid())` |
| `user_id` | `String` | FK → User, Cascade delete |
| `post_id` | `String` | FK → Post, Cascade delete |
| `parent_id` | `String?` | FK → Comment self-relation, Cascade delete, nullable |
| `body` | `String` | `@db.VarChar(2000)`, enforced 1–1000 chars in service |
| `created_at` | `DateTime` | `@default(now())` |
| `updated_at` | `DateTime` | `@updatedAt` |

Indexes: `@@index([post_id])`, `@@index([parent_id])`.

### Response Shapes

**Like toggle / status:**
```json
{ "liked": true, "likes_count": 42 }
```

**Likers list:**
```json
{
  "users": [{ "id": "…", "username": "alice", "avatar_url": "…" }],
  "total": 1, "page": 1, "limit": 20
}
```

**Comment object:**
```json
{
  "id": "…", "body": "Great post!", "parent_id": null,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z",
  "user": { "id": "…", "username": "bob", "avatar_url": "…" }
}
```

**Comments / replies list:**
```json
{
  "comments": [ /* comment objects */ ],
  "total": 5, "page": 1, "limit": 20
}
```

---

## Service Layer Logic

### LikeService

#### `toggleLike(userId, postId)`

```
1. Fetch post by postId via PostRepository.findById(postId)
   — if not found or isDeleted → throw NotFoundError
2. if post.user_id === userId → throw BadRequestError('Cannot like your own post')
3. Wrap in prisma.$transaction:
   a. attempt upsert-style: try findUnique Like where { user_id, post_id }
   b. if no existing Like:
        - prisma.like.create({ data: { user_id, post_id } })
        - prisma.post.update({ where: { id: postId },
            data: { likes_count: { increment: 1 } } })
        - action = 'created', liked = true
   c. if Like exists:
        - prisma.like.delete({ where: { id: existingLike.id } })
        - prisma.post.update({ where: { id: postId },
            data: { likes_count: { decrement: 1 } } })
        - BUT: use Math.max(0, current - 1) floor guard
              → prisma.post.update({ data: { likes_count: { decrement: 1 } } })
              → then clamp: if result < 0, set to 0 (handled via updateMany with where: { likes_count: { gt: 0 } } pattern OR check in app layer)
        - action = 'deleted', liked = false
4. After transaction commits (not inside it):
   if action === 'created':
     setImmediate(() => notificationService.dispatchLikeNotification(userId, postId, post.user_id))
5. Fetch updated post to get fresh likes_count
6. return { liked, likes_count: updatedPost.likes_count }
```

#### `getLikers(postId, { page, limit })`

```
1. Validate post exists (NotFoundError if not)
2. const skip = (page - 1) * limit
3. [likes, total] = await LikeRepository.findByPostId(postId, { skip, take: limit })
4. return { users: likes.map(l => l.user), total, page, limit }
```

#### `getLikeStatus(userId, postId)`

```
1. Validate post exists (NotFoundError if not)
2. like = await LikeRepository.findOne(userId, postId)
3. return { liked: !!like, likes_count: post.likes_count }
```

---

### CommentService

#### `createComment(userId, postId, { body, parent_id })`

```
1. Validate post exists → NotFoundError if not
2. if parent_id is provided:
   a. parent = await CommentRepository.findById(parent_id)
   b. if !parent or parent.post_id !== postId → throw NotFoundError
   c. if parent.parent_id !== null → throw BadRequestError('Max reply depth is 1')
3. Wrap in prisma.$transaction:
   a. comment = prisma.comment.create({ data: { user_id, post_id, parent_id, body } })
   b. prisma.post.update({ data: { comments_count: { increment: 1 } } })
4. After commit (setImmediate):
   if post.user_id !== userId:
     notificationService.dispatchCommentNotification(userId, postId, comment.id, post.user_id)
   if parent_id and parent.user_id !== userId:
     notificationService.dispatchReplyNotification(userId, postId, comment.id, parent.user_id)
5. return sanitizeComment(comment with user included)
```

#### `getComments(postId, { page, limit })`

```
1. Validate post exists
2. skip = (page - 1) * limit
3. [comments, total] = await CommentRepository.findTopLevelByPostId(postId, { skip, take: limit })
4. return { comments: comments.map(sanitizeComment), total, page, limit }
```

#### `getReplies(postId, commentId, { page, limit })`

```
1. parent = await CommentRepository.findById(commentId)
   if !parent or parent.post_id !== postId → throw NotFoundError
2. skip = (page - 1) * limit
3. [replies, total] = await CommentRepository.findRepliesByParentId(commentId, { skip, take: limit })
4. return { replies: replies.map(sanitizeComment), total, page, limit }
```

#### `updateComment(userId, commentId, { body })`

```
1. comment = await CommentRepository.findById(commentId) → NotFoundError if not found
2. if comment.user_id !== userId → throw ForbiddenError
3. updated = await CommentRepository.update(commentId, { body })
4. return sanitizeComment(updated)
```

#### `deleteComment(userId, commentId)`

```
1. comment = await CommentRepository.findById(commentId) → NotFoundError if not found
2. if comment.user_id !== userId → throw ForbiddenError
3. Wrap in prisma.$transaction:
   a. if comment.parent_id === null (top-level):
        - replyCount = await CommentRepository.countReplies(commentId)
        - prisma.comment.delete({ where: { id: commentId } })
          (cascade deletes all replies automatically)
        - totalDeleted = replyCount + 1
   b. else (reply):
        - prisma.comment.delete({ where: { id: commentId } })
        - totalDeleted = 1
   c. prisma.post.update({
        where: { id: comment.post_id },
        data: { comments_count: { decrement: totalDeleted } }
      })
      — floor guard: clamp to 0 if result would be negative
4. return { message: 'Comment deleted successfully' }
```

---

## Repository Layer

### LikeRepository (`like.repository.js`)

```js
// Find existing like for upsert-style toggle
findOne(userId, postId)
  → prisma.like.findUnique({ where: { user_id_post_id: { user_id, post_id } } })

// Paginated likers list with user join
findByPostId(postId, { skip, take })
  → prisma.like.findMany({
      where: { post_id: postId },
      skip, take,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id, username, avatar_url } } }
    })
  // returns [likes[], total] via Promise.all with prisma.like.count

// Delete by composite key
deleteOne(userId, postId)
  → prisma.like.delete({ where: { user_id_post_id: { user_id, post_id } } })
```

### CommentRepository (`comment.repository.js`)

```js
// Full comment with author
findById(commentId)
  → prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: { select: { id, username, avatar_url } } }
    })

// Top-level comments only (parent_id IS NULL)
findTopLevelByPostId(postId, { skip, take })
  → prisma.comment.findMany({
      where: { post_id: postId, parent_id: null },
      skip, take,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id, username, avatar_url } } }
    })
  // returns [comments[], total]

// Replies for a parent comment
findRepliesByParentId(parentId, { skip, take })
  → prisma.comment.findMany({
      where: { parent_id: parentId },
      skip, take,
      orderBy: { created_at: 'asc' },
      include: { user: { select: { id, username, avatar_url } } }
    })
  // returns [replies[], total]

// Count replies before cascade delete
countReplies(parentId)
  → prisma.comment.count({ where: { parent_id: parentId } })

// Create
create({ user_id, post_id, parent_id, body })
  → prisma.comment.create({ data: { … }, include: { user: … } })

// Update body only
update(commentId, { body })
  → prisma.comment.update({ where: { id: commentId }, data: { body } })

// Hard delete (cascade handles replies)
delete(commentId)
  → prisma.comment.delete({ where: { id: commentId } })
```

**Note:** All counter mutations on `Post` are executed inside a `prisma.$transaction([…])` alongside the Like/Comment write in the service layer, not inside the repository. The repository exposes the individual operations; the service assembles the transaction array.

---

## Validation Schemas

### `like.validation.js`

```js
const Joi = require('joi');
const uuidParam = Joi.string().uuid().required();

// POST /api/likes/:postId  &  GET /api/likes/:postId/users  &  GET /api/likes/:postId/status
const postIdParamSchema = Joi.object({ postId: uuidParam });

const likePaginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});
```

### `comment.validation.js`

```js
const Joi = require('joi');
const uuidParam = Joi.string().uuid().required();

// POST /api/comments/:postId
const createCommentSchema = Joi.object({
  body:      Joi.string().trim().min(1).max(1000).required(),
  parent_id: Joi.string().uuid().optional(),
});

// PUT /api/comments/:commentId
const updateCommentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(1000).required(),
});

// Shared param schemas
const postIdParamSchema    = Joi.object({ postId:    uuidParam });
const commentIdParamSchema = Joi.object({ commentId: uuidParam });

const postAndCommentParamSchema = Joi.object({
  postId:    uuidParam,
  commentId: uuidParam,
});

const commentPaginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});
```

All schemas are passed to `validate({ params: …, body: …, query: … })` middleware, consistent with how `post.routes.js` uses the multi-source form.

---

## Notification Integration

### Design Principle

Notifications are a **post-commit side effect**. They must not interfere with the primary like/comment transaction. If the notification dispatch fails, the like or comment still succeeds.

### Dispatch Pattern

After a successful transaction commit, the service calls the notification dispatch using `setImmediate` (or `process.nextTick`) to defer execution until after the current event loop tick, ensuring the DB transaction has fully committed:

```js
// Inside LikeService.toggleLike, after transaction commits
if (liked && post.user_id !== userId) {
  setImmediate(() => {
    notificationService.dispatchLikeNotification(userId, postId, post.user_id)
      .catch(err => console.error('[NotificationService] dispatch failed:', err));
  });
}
```

### NotificationService Interface

`notification.service.js` will implement:

```js
// Dispatches a LIKE notification. Retries up to 3 times on failure.
async dispatchLikeNotification(actorId, postId, recipientId)

// Dispatches a COMMENT notification. Retries up to 3 times on failure.
async dispatchCommentNotification(actorId, postId, commentId, recipientId)

// Dispatches a REPLY notification to the parent comment's owner.
async dispatchReplyNotification(actorId, postId, commentId, recipientId)
```

### Retry & Dedup Logic (within NotificationService)

```
dispatchWithRetry(fn, maxRetries = 3):
  for attempt 1..maxRetries:
    try: await fn()
         return  // success
    catch: wait 200ms * attempt (exponential backoff)
  log error to stderr, discard silently

dedup check (Requirement 13.6):
  before inserting a notification, query for an existing notification
  where { actor_id, recipient_id, type, reference_id }
  and created_at > (now - 60 seconds)
  if found → skip dispatch
  else     → proceed
```

Dedup is implemented inside `NotificationService` using an in-memory TTL cache (Map with expiry) for the 60-second window. This avoids an extra DB round-trip on the hot path.

### Notification Types

| Type | Trigger | Payload |
|------|---------|---------|
| `LIKE` | Like created, actor ≠ post owner | `{ actor_id, post_id }` |
| `COMMENT` | Comment created, actor ≠ post owner | `{ actor_id, post_id, comment_id }` |
| `REPLY` | Reply created, actor ≠ parent comment owner | `{ actor_id, post_id, comment_id }` |

---

## Flutter Integration

### State Management

The project uses **`provider` ^6.1.5** (confirmed from `pubspec.yaml`) with `ChangeNotifier`-based providers, following the pattern established by `FeedProvider` and similar. HTTP calls use **`dio` ^5.9.2** via the singleton `ApiClient` that attaches Bearer tokens through `DioInterceptor`.

Two new providers are added inside the existing `features/post/` feature folder:

```
connectify/lib/features/post/
├── models/
│   ├── like_status_model.dart   — { bool liked, int likesCount }
│   └── comment_model.dart       — { id, body, parentId, createdAt, updatedAt, user }
├── providers/
│   ├── like_provider.dart       — LikeProvider extends ChangeNotifier
│   └── comment_provider.dart    — CommentProvider extends ChangeNotifier
├── services/
│   └── post_service.dart        — LikeApiService + CommentApiService (Dio wrappers)
└── widgets/
    ├── like_button.dart          — LikeWidget (consumer of LikeProvider)
    └── comment_sheet.dart        — CommentSheet (DraggableScrollableSheet)
```

### LikeProvider

```dart
class LikeProvider extends ChangeNotifier {
  final String postId;
  final LikeApiService _service;

  bool _liked = false;
  int _likesCount = 0;
  bool _isLoading = false;    // true while request is in flight
  String? _error;

  // Initialised from Post data, then refreshed via fetchStatus()
  void initFromPost(int likesCount) { _likesCount = likesCount; }

  Future<void> fetchStatus() async {
    // GET /api/likes/:postId/status
    // On success: update _liked, _likesCount, notifyListeners
    // On failure: default _liked = false, retain post likesCount
  }

  Future<void> toggle() async {
    if (_isLoading) return;          // prevent duplicate taps
    // 1. Optimistic update: flip _liked, ±1 _likesCount, notifyListeners
    // 2. _isLoading = true, notifyListeners
    // 3. POST /api/likes/:postId
    // 4. On success: set _likesCount from response, notifyListeners
    // 5. On failure: revert optimistic state, set _error, notifyListeners
    // 6. _isLoading = false, notifyListeners
  }
}
```

### LikeWidget

```dart
// Scoped LikeProvider per post — created via ChangeNotifierProvider in post card
Consumer<LikeProvider>(
  builder: (ctx, likeProvider, _) {
    return Row(children: [
      GestureDetector(
        onTap: likeProvider.isLoading ? null : () => likeProvider.toggle(),
        child: Icon(
          likeProvider.liked ? Icons.favorite : Icons.favorite_border,
          color: likeProvider.liked ? Colors.red : Colors.grey,
        ),
      ),
      Text('${likeProvider.likesCount}'),
    ]);
  }
)
```

On unauthenticated tap: check auth state before calling toggle; if not authenticated, show `ScaffoldMessenger` snackbar "Please log in to like posts".

### CommentProvider

```dart
class CommentProvider extends ChangeNotifier {
  final String postId;
  final CommentApiService _service;

  List<CommentModel> _comments = [];
  bool _isLoading = false;
  bool _isFetchingMore = false;
  bool _hasMore = true;
  int _page = 1;
  int _total = 0;
  String? _error;
  String? _replyToCommentId;    // set when in reply mode
  String? _replyToUsername;

  Future<void> fetchComments({ bool refresh = false }) async { /* GET comments */ }
  Future<void> loadMore() async { /* pagination: trigger when scroll < 100px from bottom */ }
  Future<void> addComment(String body) async { /* POST comment, prepend to list */ }
  Future<void> deleteComment(String commentId) async { /* DELETE, remove from list */ }
  Future<void> editComment(String commentId, String body) async { /* PUT, update in list */ }

  void enterReplyMode(String commentId, String username) {
    _replyToCommentId = commentId;
    _replyToUsername = username;
    notifyListeners();
  }
  void exitReplyMode() { _replyToCommentId = null; _replyToUsername = null; notifyListeners(); }

  // Called after successful create/delete to notify parent post card
  void Function(int delta)? onCountChanged;
}
```

### CommentSheet

```dart
showModalBottomSheet(
  context: context,
  isScrollControlled: true,
  builder: (_) => ChangeNotifierProvider(
    create: (_) => CommentProvider(postId: post.id)..fetchComments(),
    child: const CommentSheet(),
  ),
);
```

The sheet uses a `DraggableScrollableSheet` with:
- `ListView.builder` with a `ScrollController` — triggers `loadMore()` when within 100px of the bottom
- Each `CommentTile` shows: avatar, username, body, relative timestamp (`_formatRelative(DateTime)`)
- Fixed `TextField` at bottom — switches label to `@username` in reply mode
- Long-press on own comment → `showMenu` with "Edit" and "Delete" options
- On count change: calls `onCountChanged` callback which propagates up to parent `PostCard` or `FeedProvider` to update `commentsCount` without full reload

### Relative Timestamp Format

```dart
String formatRelative(DateTime dt) {
  final diff = DateTime.now().difference(dt);
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours   < 24) return '${diff.inHours}h';
  return '${diff.inDays}d';
}
```

### Error Handling in UI

All API errors are surfaced via `ScaffoldMessenger.of(context).showSnackBar(...)` displayed for 3 seconds. On initial fetch failure the sheet shows an inline error widget with a retry button.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The feature has substantial pure-logic surface area (toggle idempotence, counter invariants, depth enforcement, ownership checks, ordering) that makes property-based testing highly appropriate. The property-based testing library used is **[fast-check](https://fast-check.dev/)** for Node.js, run with a minimum of 100 iterations per property via Jest.

---

### Property 1: Like unique-constraint enforcement

*For any* `(userId, postId)` pair, creating a `Like` record twice with the same pair SHALL throw a Prisma unique constraint violation error, and exactly one `Like` record SHALL exist afterwards.

**Validates: Requirements 1.2**

---

### Property 2: Like toggle round-trip (counter consistency)

*For any* post with N existing likes, after any sequence of toggle-like and toggle-unlike operations by distinct users, `Post.likes_count` SHALL equal the actual count of `Like` records for that post.

**Validates: Requirements 3.2, 3.3, 3.4, 11.1, 11.2, 11.7**

---

### Property 3: Like toggle idempotence

*For any* `(userId, postId)`, calling toggle twice in sequence (like then unlike) SHALL return the post to its original `likes_count` value and leave no `Like` record in the database.

**Validates: Requirements 3.2, 3.3**

---

### Property 4: Reply depth enforcement

*For any* comment that is itself a reply (i.e. has a non-null `parent_id`), attempting to create a new comment with that comment's `id` as `parent_id` SHALL be rejected with a `BadRequestError`, and no new `Comment` record SHALL be created.

**Validates: Requirements 2.10**

---

### Property 5: Comment counter consistency

*For any* post, after any sequence of comment-create and comment-delete operations (including cascaded reply deletions), `Post.comments_count` SHALL equal the actual count of `Comment` records for that post in the database.

**Validates: Requirements 6.8, 10.6, 10.7, 11.3, 11.4, 11.8**

---

### Property 6: Get comments returns only top-level records

*For any* post containing a mix of top-level comments and replies, the response from `GET /api/comments/:postId` SHALL contain only records where `parent_id` is `null`.

**Validates: Requirements 7.3**

---

### Property 7: Get replies returns only children of requested comment

*For any* `commentId`, all records returned by `GET /api/comments/:postId/replies/:commentId` SHALL have `parent_id` equal to `commentId`.

**Validates: Requirements 8.3**

---

### Property 8: Comment ownership — non-owner cannot update

*For any* comment and any `userId` that does not equal `comment.user_id`, calling `updateComment(userId, commentId, body)` SHALL throw a `ForbiddenError` and the comment body SHALL remain unchanged.

**Validates: Requirements 9.5**

---

### Property 9: Comment ownership — non-owner cannot delete

*For any* comment and any `userId` that does not equal `comment.user_id`, calling `deleteComment(userId, commentId)` SHALL throw a `ForbiddenError` and no records SHALL be deleted.

**Validates: Requirements 10.5**

> **Property reflection:** Properties 8 and 9 are distinct because they test different operations (update vs delete) on the same invariant. They are not redundant. Properties 2 and 3 overlap but are complementary: Property 2 tests arbitrary sequences (invariant), Property 3 tests the specific two-step round-trip (idempotence). Both are retained.

---

### Property 10: Relative timestamp formatting covers all ranges

*For any* `DateTime` value in the past, `formatRelative(dt)` SHALL return a string matching the pattern `^\d+[mhd]$` — specifically `Xm` for differences under 60 minutes, `Xh` for under 24 hours, and `Xd` otherwise.

**Validates: Requirements 16.4**

---

## Error Handling

### Error Handling Matrix

| Scenario | Error Class | HTTP Status |
|----------|-------------|-------------|
| Post not found | `NotFoundError` | 404 |
| Comment not found | `NotFoundError` | 404 |
| Parent comment not found or belongs to different post | `NotFoundError` | 404 |
| Reply depth > 1 attempted | `BadRequestError` | 400 |
| User likes their own post | `BadRequestError` | 400 |
| Body absent or empty | `ValidationError` (Joi) | 400 |
| Body > 1000 chars | `ValidationError` (Joi) | 400 |
| `parent_id` is not a valid UUID | `ValidationError` (Joi) | 400 |
| `page` / `limit` out of range | `ValidationError` (Joi) | 400 |
| Path param `postId` / `commentId` malformed | `ValidationError` (Joi) | 400 |
| Not authenticated (missing/expired JWT) | `AuthenticationError` | 401 |
| Authenticated but not comment owner | `ForbiddenError` | 403 |
| Prisma unique constraint violation on Like | caught → `ConflictError` or re-thrown | 409 (or 400) |
| Transaction failure (DB error) | unhandled → global error handler | 500 |
| Notification dispatch failure | logged, swallowed — not surfaced | — |

### Global Error Handler

The existing Express global error handler (`backend/src/middleware/error.middleware.js` or equivalent) already handles `AppError` subclasses by reading `err.statusCode`. No changes are needed for new error types since all new errors use existing classes.

### Counter Floor Guard

To prevent `likes_count` or `comments_count` from going below 0 due to race conditions or data inconsistency, services use a conditional decrement:

```js
// Prisma conditional update — only decrement if current value > 0
prisma.post.updateMany({
  where: { id: postId, likes_count: { gt: 0 } },
  data: { likes_count: { decrement: 1 } },
})
```

If 0 rows are updated (count was already 0), the operation is treated as a no-op and the transaction still commits. This is safe because `updateMany` inside a transaction will simply not modify the counter if the guard fails.

---

## Testing Strategy

### Overview

The feature uses a dual testing approach:
- **Unit tests** for specific examples, edge cases, and error conditions (Jest)
- **Property-based tests** for universal invariants (Jest + fast-check)

Unit tests focus on concrete examples and error paths; property tests verify that correctness holds across the full input space.

### Property-Based Tests

Library: **fast-check** (`npm install --save-dev fast-check`)
Location: `backend/src/__tests__/properties/`
Runner: Jest with `--testPathPattern=properties`
Minimum iterations: **100 per property** (configured via `fc.configureGlobal({ numRuns: 100 })`)

Each test is tagged with a comment referencing the design property:

```js
// Feature: likes-and-comments, Property 2: Like toggle round-trip (counter consistency)
test('Post.likes_count always equals COUNT(Like) after arbitrary toggles', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }), // sequence of like/unlike
      async (operations) => {
        // setup: create user + post in test DB
        // apply operations via toggleLike service
        // assert: post.likes_count === await prisma.like.count({ where: { post_id } })
      }
    )
  );
});
```

Property tests run against a real test database (PostgreSQL, separate `TEST_DATABASE_URL`). Prisma transactions make them deterministic.

### Unit Tests

Location: `backend/src/__tests__/unit/`

Key unit test scenarios:

**LikeService:**
- Toggle creates Like when none exists
- Toggle deletes Like when it exists
- Returns HTTP 400 when user likes own post
- Returns HTTP 404 for non-existent post
- Returns HTTP 401 when no JWT provided (middleware-level)

**CommentService:**
- Creates top-level comment successfully
- Creates reply to top-level comment successfully
- Rejects reply-to-reply (depth > 1) with 400
- Rejects comment with empty body
- Rejects comment body > 1000 chars
- Update fails with 403 for non-owner
- Delete top-level comment decrements count by (replies + 1)
- Delete reply decrements count by 1

**NotificationService:**
- Does not dispatch when liker is post owner
- Retries up to 3 times on failure
- Deduplicates within 60-second window

### Flutter Widget Tests

Location: `connectify/test/features/post/`

**LikeProvider tests:**
- `fetchStatus` → sets `liked` and `likesCount` from API response
- `toggle` applies optimistic update before API call
- `toggle` reverts optimistic update on API error
- `toggle` is no-op when `isLoading` is true

**CommentProvider tests:**
- `fetchComments` populates list and sets `total`
- `addComment` prepends new comment to list
- `deleteComment` removes comment from list
- `editComment` updates body in list

**`formatRelative` function (Dart unit test):**
- Returns `Xm` for durations < 60 minutes
- Returns `Xh` for durations 60 minutes to < 24 hours
- Returns `Xd` for durations ≥ 24 hours

Property test for `formatRelative` uses `package:dart_test` with generated `DateTime` values.

### Integration Tests

Location: `backend/src/__tests__/integration/`

Covers route registration (all endpoints return non-404), cascade delete behavior (delete user cascades to likes/comments), and notification dispatch end-to-end.

### Test Commands

```bash
# Backend unit tests
npm test -- --testPathPattern=unit

# Backend property tests
npm test -- --testPathPattern=properties

# All backend tests
npm test

# Flutter tests
flutter test
```
