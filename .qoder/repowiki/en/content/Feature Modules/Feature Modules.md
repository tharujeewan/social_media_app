# Feature Modules

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive documentation for the feature modules of the social media application. It covers the authentication system, posts module, comments, likes, social interactions, user profiles and following, notifications, search and discovery, media handling, and moderation. It also outlines frontend-backend integration patterns and inter-module communication. Where applicable, diagrams map to actual source files in the repository.

## Project Structure
The backend is organized into modular feature folders under backend/src/modules, each encapsulating domain-specific logic. The database schema is defined under backend/prisma/schema.prisma. The frontend is a Flutter application located under frontend/. The repository README provides high-level context for the project.

```mermaid
graph TB
subgraph "Backend"
PRISMA["Prisma Schema<br/>(backend/prisma/schema.prisma)"]
MOD_AUTH["Module: Auth<br/>(backend/src/modules/auth)"]
MOD_POSTS["Module: Posts<br/>(backend/src/modules/posts)"]
MOD_COMMENTS["Module: Comments<br/>(backend/src/modules/comments)"]
MOD_LIKES["Module: Likes<br/>(backend/src/modules/likes)"]
MOD_FEED["Module: Feed<br/>(backend/src/modules/feed)"]
MOD_USERS["Module: Users<br/>(backend/src/modules/users)"]
MOD_FOLLOWS["Module: Follows<br/>(backend/src/modules/follows)"]
MOD_MEDIA["Module: Media<br/>(backend/src/modules/media)"]
MOD_NOTIF["Module: Notifications<br/>(backend/src/modules/notifications)"]
MOD_SEARCH["Module: Search<br/>(backend/src/modules/search)"]
end
subgraph "Frontend"
FLUTTER["Flutter App<br/>(frontend/lib/main.dart)"]
end
PRISMA --> MOD_AUTH
PRISMA --> MOD_POSTS
PRISMA --> MOD_COMMENTS
PRISMA --> MOD_LIKES
PRISMA --> MOD_FEED
PRISMA --> MOD_USERS
PRISMA --> MOD_FOLLOWS
PRISMA --> MOD_MEDIA
PRISMA --> MOD_NOTIF
PRISMA --> MOD_SEARCH
FLUTTER --> MOD_AUTH
FLUTTER --> MOD_POSTS
FLUTTER --> MOD_COMMENTS
FLUTTER --> MOD_LIKES
FLUTTER --> MOD_FEED
FLUTTER --> MOD_USERS
FLUTTER --> MOD_FOLLOWS
FLUTTER --> MOD_MEDIA
FLUTTER --> MOD_NOTIF
FLUTTER --> MOD_SEARCH
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

## Core Components
- Authentication Module: Handles user registration, login, password reset, and session management.
- Posts Module: Manages CRUD operations, media attachments, and feed generation.
- Comments Module: Supports comment creation, retrieval, and deletion.
- Likes Module: Implements like/unlike logic and counters.
- Feed Module: Aggregates posts for timelines and personalized feeds.
- Users Module: Manages user profiles and account settings.
- Follows Module: Implements following/unfollowing and social graph maintenance.
- Media Module: Provides media upload and processing capabilities.
- Notifications Module: Generates and delivers notifications for actions.
- Search Module: Enables content discovery and recommendation pathways.
- Prisma Schema: Defines the data model and relationships across modules.

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

## Architecture Overview
The system follows a modular backend design with a central Prisma schema defining entities and relationships. Each feature module encapsulates its own handlers, services, and DTOs. The frontend communicates via HTTP APIs to the backend modules. Real-time updates and push notifications are integrated at the notification and media layers.

```mermaid
graph TB
CLIENT["Client App<br/>(Flutter)"]
AUTH["Auth Module"]
POSTS["Posts Module"]
COMMENTS["Comments Module"]
LIKES["Likes Module"]
FEED["Feed Module"]
USERS["Users Module"]
FOLLOWS["Follows Module"]
MEDIA["Media Module"]
NOTIF["Notifications Module"]
SEARCH["Search Module"]
DB["Prisma Schema"]
CLIENT --> AUTH
CLIENT --> POSTS
CLIENT --> COMMENTS
CLIENT --> LIKES
CLIENT --> FEED
CLIENT --> USERS
CLIENT --> FOLLOWS
CLIENT --> MEDIA
CLIENT --> NOTIF
CLIENT --> SEARCH
AUTH --> DB
POSTS --> DB
COMMENTS --> DB
LIKES --> DB
FEED --> DB
USERS --> DB
FOLLOWS --> DB
MEDIA --> DB
NOTIF --> DB
SEARCH --> DB
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

## Detailed Component Analysis

### Authentication System
- Registration: Validates input, hashes passwords, creates user records, and returns tokens or session identifiers.
- Login: Verifies credentials, manages sessions/tokens, and enforces rate limiting.
- Password Reset: Initiates reset flow, validates reset tokens, and updates passwords securely.
- Session Management: Implements secure cookies/sessions, refresh tokens, logout, and idle timeout handling.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Auth as "Auth Module"
participant DB as "Prisma Schema"
Client->>Auth : "POST /auth/register"
Auth->>DB : "Create user record"
DB-->>Auth : "User created"
Auth-->>Client : "Registration response"
Client->>Auth : "POST /auth/login"
Auth->>DB : "Verify credentials"
DB-->>Auth : "User verified"
Auth-->>Client : "Token/session established"
Client->>Auth : "POST /auth/reset-request"
Auth-->>Client : "Reset instructions sent"
Client->>Auth : "POST /auth/reset"
Auth->>DB : "Update password"
DB-->>Auth : "Password updated"
Auth-->>Client : "Success"
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Posts Module
- CRUD Operations: Create, read, update, delete posts with ownership checks.
- Media Handling: Attach images/videos to posts via the Media module.
- Feed Generation: Pull posts from followed users and personal timeline.

```mermaid
flowchart TD
Start(["Post Request"]) --> Validate["Validate Input"]
Validate --> OwnerCheck{"Owner?"}
OwnerCheck --> |No| Deny["Deny Access"]
OwnerCheck --> |Yes| Persist["Persist Post"]
Persist --> MediaAttach{"Has Media?"}
MediaAttach --> |Yes| MediaFlow["Attach Media"]
MediaAttach --> |No| SkipMedia["Skip Media"]
MediaFlow --> FeedGen["Generate Feed Entries"]
SkipMedia --> FeedGen
FeedGen --> Done(["Done"])
Deny --> Done
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Comments System
- Create Comment: Associates comment with post and author.
- Retrieve Comments: Lists comments per post with pagination.
- Delete Comment: Enforces ownership and cascade policies.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Comments as "Comments Module"
participant DB as "Prisma Schema"
Client->>Comments : "POST /posts/{id}/comments"
Comments->>DB : "Insert comment"
DB-->>Comments : "Comment saved"
Comments-->>Client : "Comment created"
Client->>Comments : "GET /posts/{id}/comments"
Comments->>DB : "Fetch comments"
DB-->>Comments : "Comments list"
Comments-->>Client : "Comments"
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Likes Functionality
- Like/Unlike: Toggle like state for a post.
- Counters: Maintain like counts and sync with real-time updates.

```mermaid
flowchart TD
A["User selects Like"] --> B{"Already liked?"}
B --> |Yes| C["Remove like"]
B --> |No| D["Add like"]
C --> E["Update count"]
D --> E
E --> F["Notify followers"]
F --> G["Done"]
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Social Interactions and Following
- Follow/Unfollow: Updates social graph and affects feed visibility.
- Social Graph: Maintains relationships and privacy-aware queries.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Follows as "Follows Module"
participant DB as "Prisma Schema"
Client->>Follows : "POST /users/{id}/follow"
Follows->>DB : "Insert follow relationship"
DB-->>Follows : "Relationship created"
Follows-->>Client : "OK"
Client->>Follows : "DELETE /users/{id}/unfollow"
Follows->>DB : "Delete follow relationship"
DB-->>Follows : "Relationship removed"
Follows-->>Client : "OK"
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### User Profiles and Account Settings
- Profile Read/Update: Fetches public info and allows private updates.
- Privacy Controls: Manages visibility of posts and profile details.

```mermaid
classDiagram
class User {
+id
+username
+email
+bio
+isPrivate
+createdAt
}
class ProfileController {
+getProfile(userId)
+updateProfile(userId, data)
}
ProfileController --> User : "reads/writes"
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Notifications System
- Event Triggers: On likes, comments, follows, mentions.
- Delivery Channels: In-app notifications and push notifications.

```mermaid
sequenceDiagram
participant Post as "Posts Module"
participant Notif as "Notifications Module"
participant DB as "Prisma Schema"
participant Push as "Push Service"
Post->>DB : "Like recorded"
DB-->>Post : "Like persisted"
Post->>Notif : "Create notification event"
Notif->>DB : "Insert notification"
DB-->>Notif : "Notification stored"
Notif->>Push : "Send push payload"
Push-->>Notif : "Delivered"
Notif-->>Post : "OK"
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Search and Content Discovery
- Search: Full-text search across posts and users.
- Recommendations: Personalized suggestions based on activity and follows.

```mermaid
flowchart TD
S0["User enters query"] --> S1["Normalize query"]
S1 --> S2{"Query type?"}
S2 --> |Text| S3["Full-text search posts/users"]
S2 --> |Tags| S4["Tag-based filtering"]
S3 --> S5["Rank results"]
S4 --> S5
S5 --> S6["Return ranked items"]
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Media Upload and Processing
- Upload: Accepts media files, validates types/sizes.
- Processing: Stores metadata and triggers background processing.
- Storage Integration: Integrates with cloud/object storage.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Media as "Media Module"
participant Storage as "Object Storage"
participant DB as "Prisma Schema"
Client->>Media : "Upload media"
Media->>Storage : "Store file"
Storage-->>Media : "File URL"
Media->>DB : "Save metadata"
DB-->>Media : "Saved"
Media-->>Client : "Media ID and URL"
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

### Content Moderation
- Reporting: Users can report inappropriate content.
- Review Queue: Moderators review flagged items.
- Actions: Hide, remove, or restrict content.

```mermaid
flowchart TD
M0["Report submitted"] --> M1["Flag content"]
M1 --> M2["Notify moderators"]
M2 --> M3{"Review outcome"}
M3 --> |Remove| M4["Delete content"]
M3 --> |Restrict| M5["Apply restrictions"]
M3 --> |Ignore| M6["No action"]
M4 --> M7["Done"]
M5 --> M7
M6 --> M7
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

## Dependency Analysis
- Internal Coupling: Modules depend on the shared Prisma schema for data access.
- Frontend Integration: Flutter app consumes REST endpoints exposed by backend modules.
- External Services: Media module integrates with object storage; notifications module integrates with push providers.

```mermaid
graph LR
FLUTTER["Flutter App"] --> AUTH["Auth Module"]
FLUTTER --> POSTS["Posts Module"]
FLUTTER --> MEDIA["Media Module"]
FLUTTER --> NOTIF["Notifications Module"]
AUTH --> DB["Prisma Schema"]
POSTS --> DB
MEDIA --> DB
NOTIF --> DB
```

**Diagram sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

## Performance Considerations
- Database Indexes: Ensure appropriate indexes on foreign keys, timestamps, and searchable fields.
- Pagination: Implement cursor-based pagination for feeds and lists.
- Caching: Cache frequently accessed profiles and popular posts.
- Background Jobs: Offload media processing and notifications to background workers.
- CDN: Serve media via CDN for reduced latency.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Authentication Failures: Verify credentials, token expiration, and rate limits.
- Media Upload Issues: Check file types, sizes, and storage permissions.
- Notification Delivery: Confirm push provider credentials and device tokens.
- Search Results: Validate full-text indexes and query normalization.

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)

## Conclusion
The application employs a modular backend architecture with a centralized Prisma schema and clear separation of concerns across feature modules. The frontend integrates via REST APIs, while real-time and push integrations are handled at the notifications layer. Robust indexing, caching, and background job processing are recommended to maintain performance and scalability.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Data Model Overview: Entities and relationships are defined in the Prisma schema.
- Frontend Entry Point: Flutter application entry point is under frontend/lib/main.dart.

**Section sources**
- [schema.prisma](file://backend/prisma/schema.prisma)
- [README.md](file://README.md)