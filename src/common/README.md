# Common Module Documentation

This directory contains shared components, utilities, and configurations used across the entire application.

## Structure

### Decorators
- `api-endpoint.decorator.ts`: Common API documentation decorators

### DTOs
- `pagination.dto.ts`: Pagination request/response DTOs

### Exceptions
- `validation.exception.ts`: Custom validation exception

### Filters
- `all-exceptions.filter.ts`: Global exception handler
- `http-exception.filter.ts`: HTTP exception handler
- `mongo-exception.filter.ts`: MongoDB exception handler
- `validation-exception.filter.ts`: Validation exception handler

### Middleware
- `logging.middleware.ts`: Request/response logging middleware

### Pipes
- `parse-object-id.pipe.ts`: MongoDB ObjectId validation pipe

## Usage

Import shared components from their respective directories:

```typescript
import { LoggingMiddleware } from './common/middleware';
import { ParseObjectIdPipe } from './common/pipes';
import { ApiEndpoint } from './common/decorators';
```
