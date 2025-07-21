# Project Structure Documentation

This document outlines the improved project structure following NestJS best practices and domain-driven design principles.

## Directory Structure

```
src/
├── common/                    # Shared application components
│   ├── decorators/           # Custom decorators
│   ├── dto/                  # Shared DTOs (pagination, etc.)
│   ├── exceptions/           # Custom exceptions
│   ├── filters/              # Global exception filters
│   ├── middleware/           # Global middleware
│   └── pipes/                # Global pipes
├── config/                   # Application configuration
│   ├── env.validation.ts     # Environment validation
│   └── configuration.ts     # Configuration service
├── modules/                  # Feature modules
│   └── {module-name}/        # Individual feature modules
│       ├── constants/        # Module-specific constants
│       ├── dto/              # Module-specific DTOs
│       ├── entities/         # Module-specific entities
│       ├── interfaces/       # Module-specific interfaces
│       ├── {module}.controller.ts
│       ├── {module}.controller.spec.ts
│       ├── {module}.service.ts
│       ├── {module}.service.spec.ts
│       ├── {module}.module.ts
│       └── README.md         # Module documentation
├── shared/                   # Truly shared code
│   ├── constants/           # Application-wide constants
│   ├── enums/               # Shared enums
│   └── types/               # Shared TypeScript types
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point
```

## Module Structure Guidelines

Each module should follow this structure:

### Required Files
- `{module}.controller.ts` - REST API endpoints
- `{module}.service.ts` - Business logic
- `{module}.module.ts` - Module configuration
- `README.md` - Module documentation

### Optional Directories
- `/dto` - Data Transfer Objects specific to this module
- `/entities` - Database entities for this module
- `/interfaces` - TypeScript interfaces for this module
- `/constants` - Module-specific constants
- `/guards` - Module-specific guards
- `/decorators` - Module-specific decorators

### Test Files
- `{module}.controller.spec.ts` - Controller unit tests
- `{module}.service.spec.ts` - Service unit tests
- `{module}.e2e-spec.ts` - End-to-end tests (optional)

## Best Practices

### 1. Import Paths
Use relative imports within modules:
```typescript
import { CreateStoreDto } from './dto/store.dto';
import { Store } from './entities/store.entity';
```

Use absolute imports for shared code:
```typescript
import { UserRole } from '@shared/enums';
import { PaginationOptions } from '@shared/types';
```

### 2. Entity Organization
- Each module contains its own entities
- Shared entities go in `shared/entities` (if any)
- Entities implement their respective interfaces

### 3. DTO Organization
- Module-specific DTOs in `{module}/dto`
- Shared DTOs in `common/dto`
- Export DTOs through index files

### 4. Interface Definition
- Define clear contracts for services
- Use interfaces for better type safety
- Keep interfaces separate from implementations

### 5. Constants Management
- Module-specific constants in `{module}/constants`
- Application-wide constants in `shared/constants`
- Use const assertions for literal types

### 6. Testing Strategy
- Unit tests alongside implementation files
- Integration tests in separate test directories
- Mock external dependencies

## Migration Guide

To migrate existing modules to this structure:

1. Create new directories for each module
2. Move entities to respective module directories
3. Create interfaces for each entity
4. Move module-specific DTOs
5. Add test files
6. Update import paths
7. Add module documentation

## Benefits

1. **Better Encapsulation**: Each module is self-contained
2. **Improved Maintainability**: Clear separation of concerns
3. **Enhanced Type Safety**: Interfaces provide better contracts
4. **Easier Testing**: Tests are co-located with implementation
5. **Better Documentation**: Each module is documented
6. **Scalability**: Structure scales with application growth
