# Shared Module Documentation

This directory contains truly shared code, constants, types, and enums used across multiple modules.

## Structure

### Constants
- `app.constants.ts`: Application-wide constants

### Enums
- `index.ts`: All shared enums (AccountType, UserRole, OrderStatus, etc.)

### Types
- `common.types.ts`: Common TypeScript interfaces and types
- `index.ts`: Type exports

## Usage

Import shared items:

```typescript
import { UserRole, AccountType } from '@shared/enums';
import { PaginationOptions, ApiResponse } from '@shared/types';
import { DEFAULT_PAGE_SIZE, ERROR_MESSAGES } from '@shared/constants/app.constants';
```

## Guidelines

- Only add truly shared code here
- Module-specific constants should stay in their respective modules
- Keep interfaces generic and reusable
- Document any breaking changes
