# Stores Module

## Description
The Stores module handles all store-related operations in the Forage Stores application. It provides functionality for creating, reading, updating, and deleting store information.

## Features
- Create new stores
- List all stores
- Get store details
- Update store information
- Delete stores

## Architecture
- `stores.controller.ts`: REST API endpoints for store operations
- `stores.service.ts`: Business logic and data access layer
- `stores.module.ts`: Module configuration and dependency injection
- `/dto`: Data Transfer Objects for store operations
- `/entities`: Store entity definition and schema
- `/interfaces`: TypeScript interfaces for stores

## Usage
### Import the module
```typescript
import { StoresModule } from './modules/stores/stores.module';

@Module({
  imports: [StoresModule],
})
export class AppModule {}
```

### Inject the service
```typescript
constructor(private readonly storesService: StoresService) {}
```

### Available Methods
```typescript
// Create a new store
const store = await storesService.create(createStoreDto);

// Get all stores
const stores = await storesService.findAll();

// Get store by ID
const store = await storesService.findOne(id);

// Update store
const updated = await storesService.update(id, updateStoreDto);

// Delete store
const deleted = await storesService.remove(id);
```

## Testing
Run unit tests:
```bash
npm run test stores.service
npm run test stores.controller
```
