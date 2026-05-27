# Search & Content Discovery

<cite>
**Referenced Files in This Document**
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [search.module.ts](file://backend/src/modules/search/search.module.ts)
- [prisma.service.ts](file://backend/src/modules/search/prisma.service.ts)
- [posts.service.ts](file://backend/src/modules/posts/posts.service.ts)
- [users.service.ts](file://backend/src/modules/users/users.service.ts)
- [hashtags.service.ts](file://backend/src/modules/hashtags/hashtags.service.ts)
- [feed.service.ts](file://backend/src/modules/feed/feed.service.ts)
- [auth.service.ts](file://backend/src/modules/auth/auth.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/jwt.strategy.ts)
- [search.dto.ts](file://backend/src/modules/search/search.dto.ts)
- [hashtag-search.dto.ts](file://backend/src/modules/search/hashtag-search.dto.ts)
- [autocomplete.dto.ts](file://backend/src/modules/search/autocomplete.dto.ts)
- [search.analytics.ts](file://backend/src/modules/search/search.analytics.ts)
- [search.cache.ts](file://backend/src/modules/search/search.cache.ts)
- [search.indexer.ts](file://backend/src/modules/search/search.indexer.ts)
- [search.filters.ts](file://backend/src/modules/search/search.filters.ts)
- [search.relevance.ts](file://backend/src/modules/search/search.relevance.ts)
- [search.personalization.ts](file://backend/src/modules/search/search.personalization.ts)
- [search.suggestions.ts](file://backend/src/modules/search/search.suggestions.ts)
- [search.optimization.ts](file://backend/src/modules/search/search.optimization.ts)
- [search.performance.ts](file://backend/src/modules/search/search.performance.ts)
- [search.feedback.ts](file://backend/src/modules/search/search.feedback.ts)
- [search.routes.ts](file://backend/src/routes/search.routes.ts)
- [app.module.ts](file://backend/src/app.module.ts)
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

## Introduction
This document provides comprehensive documentation for the search and content discovery functionality in the social media platform. It covers full-text search, content indexing, result ranking, user search, hashtag search, and content discovery features. The implementation includes search algorithms, relevance scoring, personalized search results, filters, faceted search, advanced query capabilities, autocomplete, suggestions, query optimization, performance optimization, caching strategies, real-time indexing, analytics, logging, and feedback mechanisms.

## Project Structure
The search functionality is organized under the search module with clear separation of concerns:
- Controllers handle HTTP requests and responses
- Services encapsulate business logic and data operations
- DTOs define request/response schemas
- Analytics, cache, indexer, filters, relevance, personalization, suggestions, optimization, performance, and feedback modules support specialized search features
- Routes connect endpoints to controllers
- Prisma service manages database operations

```mermaid
graph TB
subgraph "Search Module"
SC["search.controller.ts"]
SS["search.service.ts"]
SM["search.module.ts"]
PRISMA["prisma.service.ts"]
DTO["search.dto.ts"]
HASHTOPIA["hashtags.service.ts"]
POSTS["posts.service.ts"]
USERS["users.service.ts"]
FEED["feed.service.ts"]
AUTH["auth.service.ts"]
end
subgraph "Support Modules"
AN["search.analytics.ts"]
CA["search.cache.ts"]
IDX["search.indexer.ts"]
FILT["search.filters.ts"]
REL["search.relevance.ts"]
PER["search.personalization.ts"]
SUG["search.suggestions.ts"]
OPT["search.optimization.ts"]
PERF["search.performance.ts"]
FEEDBACK["search.feedback.ts"]
end
subgraph "Routes"
ROUTES["search.routes.ts"]
end
SC --> SS
SS --> PRISMA
SS --> HASHTOPIA
SS --> POSTS
SS --> USERS
SS --> FEED
SS --> AUTH
SS --> AN
SS --> CA
SS --> IDX
SS --> FILT
SS --> REL
SS --> PER
SS --> SUG
SS --> OPT
SS --> PERF
SS --> FEEDBACK
ROUTES --> SC
SM --> SC
SM --> SS
```

**Diagram sources**
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [search.module.ts](file://backend/src/modules/search/search.module.ts)
- [prisma.service.ts](file://backend/src/modules/search/prisma.service.ts)
- [search.routes.ts](file://backend/src/routes/search.routes.ts)

**Section sources**
- [search.module.ts](file://backend/src/modules/search/search.module.ts)
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.service.ts](file://backend/src/modules/search/search.service.ts)

## Core Components
The search system consists of several interconnected components that work together to provide robust search capabilities:

### Search Controller
Handles HTTP requests for search operations, validates input DTOs, and orchestrates service calls. It supports multiple search types including user search, hashtag search, and content search with appropriate response formatting.

### Search Service
Implements the core search logic including query parsing, result aggregation, filtering, and ranking. It coordinates with specialized modules for analytics, caching, indexing, and personalization.

### Database Integration
Utilizes Prisma ORM for efficient database queries and maintains normalized data structures optimized for search operations.

### Specialized Search Modules
- **Analytics**: Tracks search queries, result clicks, and engagement metrics
- **Cache**: Implements multi-level caching for improved performance
- **Indexer**: Manages real-time content indexing and updates
- **Filters**: Provides faceted search capabilities with dynamic filters
- **Relevance**: Implements sophisticated ranking algorithms
- **Personalization**: Adapts results based on user preferences and behavior
- **Suggestions**: Generates autocomplete and query suggestions
- **Optimization**: Includes query optimization and performance tuning
- **Performance**: Monitors and reports search performance metrics
- **Feedback**: Collects user feedback on search results

**Section sources**
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [prisma.service.ts](file://backend/src/modules/search/prisma.service.ts)

## Architecture Overview
The search architecture follows a layered approach with clear separation between presentation, business logic, and data access layers. The system supports both synchronous and asynchronous operations for optimal performance.

```mermaid
sequenceDiagram
participant Client as "Client Application"
participant Controller as "SearchController"
participant Service as "SearchService"
participant Cache as "SearchCache"
participant Indexer as "SearchIndexer"
participant DB as "PrismaService"
participant Analytics as "SearchAnalytics"
Client->>Controller : GET /api/search?q=term&filters=...
Controller->>Service : validateAndParse(query)
Service->>Cache : getCachedResults(query)
Cache-->>Service : cachedResults | miss
alt Cache Hit
Service-->>Controller : formattedResults
else Cache Miss
Service->>Indexer : searchDocuments(query)
Indexer->>DB : executeQuery(query)
DB-->>Indexer : rawResults
Indexer-->>Service : indexedResults
Service->>Service : applyFilters(results)
Service->>Service : calculateRelevance(results)
Service->>Cache : cacheResults(query, results)
Service->>Analytics : logSearch(query, results)
Service-->>Controller : formattedResults
end
Controller-->>Client : JSON Results
```

**Diagram sources**
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [search.cache.ts](file://backend/src/modules/search/search.cache.ts)
- [search.indexer.ts](file://backend/src/modules/search/search.indexer.ts)
- [prisma.service.ts](file://backend/src/modules/search/prisma.service.ts)
- [search.analytics.ts](file://backend/src/modules/search/search.analytics.ts)

## Detailed Component Analysis

### Full-Text Search Implementation
The system implements comprehensive full-text search capabilities with support for multiple content types including posts, users, and hashtags.

```mermaid
flowchart TD
Start(["Search Request"]) --> Parse["Parse Query String"]
Parse --> Normalize["Normalize Text<br/>- Remove special chars<br/>- Apply stemming<br/>- Handle accents"]
Normalize --> Tokenize["Tokenize Query<br/>- Split by spaces<br/>- Extract phrases<br/>- Identify operators"]
Tokenize --> Build["Build Query AST<br/>- AND/OR logic<br/>- NOT negation<br/>- Proximity search"]
Build --> Execute["Execute Search<br/>- Posts table<br/>- Users table<br/>- Hashtags table"]
Execute --> Aggregate["Aggregate Results<br/>- Merge duplicates<br/>- Apply filters<br/>- Sort by relevance"]
Aggregate --> Format["Format Response<br/>- Paginate results<br/>- Add metadata<br/>- Include highlights"]
Format --> End(["Return Results"])
```

**Diagram sources**
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [search.relevance.ts](file://backend/src/modules/search/search.relevance.ts)
- [search.filters.ts](file://backend/src/modules/search/search.filters.ts)

### Content Indexing System
Real-time indexing ensures search results remain current with minimal latency.

```mermaid
classDiagram
class SearchIndexer {
+indexPost(post) void
+indexUser(user) void
+indexHashtag(hashtag) void
+updateIndex(document) void
+removeFromIndex(id) void
+bulkIndex(documents) void
}
class PostIndex {
+text : string
+userId : string
+hashtags : string[]
+mentions : string[]
+timestamp : Date
+tags : string[]
}
class UserIndex {
+username : string
+displayName : string
+bio : string
+hashtags : string[]
}
class HashtagIndex {
+name : string
+usageCount : number
+trendingScore : number
}
SearchIndexer --> PostIndex : "manages"
SearchIndexer --> UserIndex : "manages"
SearchIndexer --> HashtagIndex : "manages"
```

**Diagram sources**
- [search.indexer.ts](file://backend/src/modules/search/search.indexer.ts)

### Relevance Scoring and Ranking
Sophisticated ranking algorithms combine multiple factors to determine result relevance.

```mermaid
flowchart TD
Raw["Raw Search Results"] --> Weight["Apply Weight Factors<br/>- Content match (40%)<br/>- User reputation (25%)<br/>- Recency (20%)<br/>- Engagement (15%)"]
Weight --> Boost["Apply Boost Factors<br/>- Exact matches (+10%)<br/>- Hashtag mentions (+5%)<br/>- User follows (+8%)<br/>- Recent activity (+3%)"]
Boost --> Personalize["Personalize Scores<br/>- User preferences<br/>- Past behavior<br/>- Social connections"]
Personalize --> Normalize["Normalize Scores<br/>- Min-max scaling<br/>- Threshold filtering"]
Normalize --> Rank["Rank Results<br/>- Stable sort<br/>- Tie-breaking rules"]
Rank --> Output["Return Ranked Results"]
```

**Diagram sources**
- [search.relevance.ts](file://backend/src/modules/search/search.relevance.ts)
- [search.personalization.ts](file://backend/src/modules/search/search.personalization.ts)

### Search Filters and Faceted Search
Dynamic filtering allows users to refine search results based on various criteria.

```mermaid
classDiagram
class SearchFilters {
+applyDateFilter(results, startDate, endDate) results
+applyContentTypeFilter(results, types) results
+applyUserTypeFilter(results, userTypes) results
+applyEngagementFilter(results, minLikes, minShares) results
+buildFacetedResults(filters) FacetedResults
+generateFilterOptions(contentType) FilterOptions
}
class FilterCriteria {
+dateRange : DateRange
+contentTypes : ContentType[]
+userTypes : UserType[]
+engagementRange : EngagementRange
+location : Location
+language : string
}
class FacetedResults {
+results : SearchResult[]
+facets : Facet[]
+total : number
+filters : AppliedFilters
}
SearchFilters --> FilterCriteria : "uses"
SearchFilters --> FacetedResults : "produces"
```

**Diagram sources**
- [search.filters.ts](file://backend/src/modules/search/search.filters.ts)

### Autocomplete and Suggestions
Intelligent autocomplete provides real-time query assistance.

```mermaid
sequenceDiagram
participant User as "User Typing"
participant Auto as "AutocompleteService"
participant Cache as "SuggestionCache"
participant Analytics as "UsageAnalytics"
User->>Auto : typing event
Auto->>Cache : getSuggestions(term)
Cache-->>Auto : cachedSuggestions | miss
alt Cache Hit
Auto-->>User : showCachedSuggestions
else Cache Miss
Auto->>Auto : analyzeQueryContext
Auto->>Analytics : getPopularTerms(term)
Analytics-->>Auto : trendingTerms
Auto->>Auto : generateSuggestions()
Auto->>Cache : cacheSuggestions(term, suggestions)
Auto-->>User : showSuggestions
end
```

**Diagram sources**
- [search.suggestions.ts](file://backend/src/modules/search/search.suggestions.ts)
- [search.cache.ts](file://backend/src/modules/search/search.cache.ts)
- [search.analytics.ts](file://backend/src/modules/search/search.analytics.ts)

### Personalized Search Results
Results are tailored to individual user preferences and behavior patterns.

```mermaid
flowchart TD
Query["Search Query"] --> Base["Base Results"]
Base --> UserPrefs["Load User Preferences"]
UserPrefs --> Behavior["Analyze User Behavior"]
Behavior --> Social["Consider Social Connections"]
Social --> Context["Apply Contextual Factors"]
Context --> Adjust["Adjust Relevance Scores"]
Adjust --> Final["Final Personalized Results"]
subgraph "User Preferences"
Prefs["Content preferences<br/>- Interests<br/>- Topics<br/>- Content types"]
end
subgraph "Behavior Analysis"
History["Search history<br/>- Frequently searched terms<br/>- Click patterns<br/>- Time spent"]
Eng["Engagement history<br/>- Likes<br/>- Shares<br/>- Saves"]
end
subgraph "Social Factors"
Follows["Followed users<br/>- Content from followed"]
Similar["Similar users<br/>- Trending among peers"]
end
subgraph "Contextual Factors"
Time["Temporal context<br/>- Trending now<br/>- Recent activity"]
Location["Geographic context<br/>- Local content"]
end
```

**Diagram sources**
- [search.personalization.ts](file://backend/src/modules/search/search.personalization.ts)

### Advanced Query Capabilities
Support for complex queries including boolean logic, phrase matching, and proximity searches.

```mermaid
classDiagram
class QueryParser {
+parseBooleanQuery(queryString) QueryExpression
+parsePhraseQuery(phrase) PhraseExpression
+parseProximityQuery(term1, term2, distance) ProximityExpression
+parseWildcardQuery(pattern) WildcardExpression
+extractFilters(expression) FilterCriteria
}
class QueryExpression {
<<abstract>>
+evaluate(context) boolean
}
class BooleanExpression {
+left : QueryExpression
+operator : BooleanOperator
+right : QueryExpression
}
class PhraseExpression {
+terms : string[]
+exactMatch : boolean
}
class ProximityExpression {
+term1 : string
+term2 : string
+distance : number
+mustOrder : boolean
}
QueryParser --> QueryExpression : "creates"
QueryExpression <|-- BooleanExpression
QueryExpression <|-- PhraseExpression
QueryExpression <|-- ProximityExpression
```

**Diagram sources**
- [search.service.ts](file://backend/src/modules/search/search.service.ts)

### Search Analytics and Feedback
Comprehensive tracking and feedback collection for search improvement.

```mermaid
classDiagram
class SearchAnalytics {
+logSearch(query, results, metadata) void
+logClick(resultId, userId, position) void
+logFeedback(feedback) void
+getSearchMetrics(period) SearchMetrics
+getUserSearchPatterns(userId) SearchPatterns
}
class SearchFeedback {
+resultId : string
+userId : string
+rating : number
+feedbackText : string
+timestamp : Date
+category : FeedbackCategory
}
class SearchMetrics {
+totalQueries : number
+avgResponseTime : number
+clickThroughRate : number
+avgRating : number
+popularTerms : PopularTerm[]
+trendingTopics : TrendingTopic[]
}
SearchAnalytics --> SearchFeedback : "collects"
SearchAnalytics --> SearchMetrics : "generates"
```

**Diagram sources**
- [search.analytics.ts](file://backend/src/modules/search/search.analytics.ts)
- [search.feedback.ts](file://backend/src/modules/search/search.feedback.ts)

**Section sources**
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.analytics.ts](file://backend/src/modules/search/search.analytics.ts)
- [search.cache.ts](file://backend/src/modules/search/search.cache.ts)
- [search.indexer.ts](file://backend/src/modules/search/search.indexer.ts)
- [search.filters.ts](file://backend/src/modules/search/search.filters.ts)
- [search.relevance.ts](file://backend/src/modules/search/search.relevance.ts)
- [search.personalization.ts](file://backend/src/modules/search/search.personalization.ts)
- [search.suggestions.ts](file://backend/src/modules/search/search.suggestions.ts)
- [search.feedback.ts](file://backend/src/modules/search/search.feedback.ts)

## Dependency Analysis
The search module has well-defined dependencies that support scalability and maintainability.

```mermaid
graph TB
subgraph "External Dependencies"
PRISMA["Prisma ORM"]
REDIS["Redis Cache"]
ELASTIC["Elasticsearch"]
JWT["JWT Authentication"]
end
subgraph "Internal Dependencies"
POSTS["Posts Service"]
USERS["Users Service"]
HASHTAGS["Hashtags Service"]
FEED["Feed Service"]
AUTH["Auth Service"]
end
subgraph "Search Module"
SC["Search Controller"]
SS["Search Service"]
CA["Cache Module"]
AN["Analytics Module"]
IDX["Indexer Module"]
end
SC --> SS
SS --> CA
SS --> AN
SS --> IDX
SS --> POSTS
SS --> USERS
SS --> HASHTAGS
SS --> FEED
SS --> AUTH
SS --> PRISMA
CA --> REDIS
IDX --> ELASTIC
SS --> JWT
```

**Diagram sources**
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [search.cache.ts](file://backend/src/modules/search/search.cache.ts)
- [search.analytics.ts](file://backend/src/modules/search/search.analytics.ts)
- [search.indexer.ts](file://backend/src/modules/search/search.indexer.ts)

**Section sources**
- [search.module.ts](file://backend/src/modules/search/search.module.ts)
- [app.module.ts](file://backend/src/app.module.ts)

## Performance Considerations
The search system implements multiple optimization strategies for high-performance operations:

### Caching Strategy
- Multi-level caching with Redis for frequently accessed queries
- Intelligent cache invalidation based on content updates
- Cache warming for popular search terms
- TTL management for stale data prevention

### Query Optimization
- Database query optimization with proper indexing
- Query result caching for repeated searches
- Lazy loading of non-critical data
- Batch operations for bulk updates

### Real-time Indexing
- Incremental indexing for new content
- Background indexing jobs for large datasets
- Conflict resolution for concurrent updates
- Index maintenance and optimization

### Scalability Features
- Horizontal scaling support
- Load balancing for search operations
- Database connection pooling
- Asynchronous processing for heavy operations

**Section sources**
- [search.cache.ts](file://backend/src/modules/search/search.cache.ts)
- [search.optimization.ts](file://backend/src/modules/search/search.optimization.ts)
- [search.performance.ts](file://backend/src/modules/search/search.performance.ts)
- [search.indexer.ts](file://backend/src/modules/search/search.indexer.ts)

## Troubleshooting Guide
Common issues and their solutions:

### Search Not Returning Results
- Verify database connectivity and indexing status
- Check query syntax and special character handling
- Review filter configurations and facet options
- Monitor cache health and invalidation policies

### Performance Issues
- Analyze query execution plans and optimize slow queries
- Review cache hit rates and adjust TTL settings
- Monitor database connection pool usage
- Check for memory leaks in long-running operations

### Authentication Problems
- Verify JWT token validity and expiration
- Check user permissions for content access
- Review session management and refresh tokens
- Monitor authentication service availability

### Indexing Failures
- Check Elasticsearch cluster health and connectivity
- Verify document mapping and field types
- Review indexing job logs and error messages
- Monitor disk space and memory usage

**Section sources**
- [search.controller.ts](file://backend/src/modules/search/search.controller.ts)
- [search.service.ts](file://backend/src/modules/search/search.service.ts)
- [prisma.service.ts](file://backend/src/modules/search/prisma.service.ts)
- [jwt.strategy.ts](file://backend/src/modules/auth/jwt.strategy.ts)

## Conclusion
The search and content discovery system provides a comprehensive, scalable solution for finding relevant content in the social media platform. Its modular architecture supports extensibility while maintaining performance through intelligent caching, real-time indexing, and sophisticated ranking algorithms. The system's personalization capabilities and analytics framework enable continuous improvement of search quality based on user behavior and engagement patterns.