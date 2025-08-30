# Complete User Account Management System

## Overview
This document describes the comprehensive user account management system implemented for the Forage Stores Backend, providing full lifecycle management of user accounts with advanced features.

## Features Implemented

### 1. Profile Management ✅
- **Profile Updates**: Complete CRUD operations for user profiles
- **Field Updates**: Name, email, phone, city, address, account type
- **Validation**: Comprehensive validation using class-validator
- **Security**: Authenticated access required for profile operations

### 2. Profile Image Upload ✅
- **File Upload**: Multer-based image upload with validation
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **File Size Limit**: 5MB maximum
- **Storage**: Local filesystem with organized directory structure
- **URL Generation**: Automatic profile image URL assignment
- **File Management**: Upload and delete functionality

### 3. Account Type Switching (Role Promotion) ✅
- **Growth Management**: Automated qualification checking system
- **Role Progression**: USER → GROWTH_ASSOCIATE → GROWTH_ELITE
- **Qualification Metrics**:
  - **Growth Associate**: 100 referrals + ₦600k total spend
  - **Growth Elite**: 1000 referrals + ₦600k per referral annually for 2 years
- **City-Based Limitations**: Enforced limits per city
- **Automated Processing**: Background jobs handle promotions

### 4. Status Progression ✅
- **Account Status Enum**: PENDING, ACTIVE, SUSPENDED, DEACTIVATED, BANNED
- **Automated Progression**: Nightly qualification checks
- **Status Tracking**: Email verification, account activation
- **Access Control**: Status-based access restrictions

### 5. Scheduled Tasks ✅
- **Daily Qualification Checks**: `@Cron('0 2 * * *')` for GA/GE promotions
- **Monthly Profit Distribution**: `@Cron('0 3 1 * *')` for revenue sharing
- **Background Processing**: Non-blocking scheduled job execution
- **Error Handling**: Comprehensive error logging and reporting

### 6. City-Based Limitations ✅
- **Growth Associate Limits**: Max 50 per major city, scaled for others
- **Growth Elite Limits**: Max 20 per major city, scaled for others
- **City Configuration**: Configurable limits per city
- **Enforcement**: Pre-promotion validation checks

### 7. Account Deactivation/Reactivation ✅
- **Self Deactivation**: Users can deactivate their own accounts
- **Admin Control**: Admins can deactivate/reactivate any account
- **Status Management**: Proper status transitions
- **Access Prevention**: Deactivated accounts cannot login

### 8. Admin Search and Filtering ✅
- **Multiple Filters**: By role, account type, city, account status
- **Query Parameters**: Flexible filtering in endpoints
- **Admin-Only Access**: Proper role-based access control
- **Comprehensive Search**: Combined filter capabilities

### 9. Validation and Security ✅
- **Input Validation**: class-validator decorators on all DTOs
- **Custom Pipes**: ParseObjectIdPipe for MongoDB ObjectId validation
- **Guards**: Role-based and account status guards
- **Exception Filters**: Comprehensive error handling

### 10. Service Separation ✅
- **UsersService**: Core user CRUD operations
- **FileUploadService**: Profile image management
- **GrowthManagementService**: GA/GE qualification logic
- **AuthService**: Authentication and account status
- **Clear Boundaries**: Well-defined service responsibilities

## API Endpoints

### Profile Management
```
GET    /users/profile/:id           - Get user profile
PATCH  /users/profile/:id           - Update user profile
PATCH  /users/profile/:id/password  - Update password
POST   /users/profile/:id/image     - Upload profile image
DELETE /users/profile/:id/image     - Delete profile image
PATCH  /users/:id/deactivate        - Deactivate account
PATCH  /users/:id/reactivate        - Reactivate account
```

### Admin Operations
```
GET    /users                       - Get all users (with filters)
GET    /users/:id                   - Get user by ID
POST   /users                       - Create new user
PATCH  /users/:id                   - Update user
DELETE /users/:id                   - Delete user
PATCH  /users/:id/credit-score      - Update credit score
GET    /users/filter/role/:role     - Get users by role
GET    /users/filter/account-type/:type - Get users by account type
GET    /users/filter/city/:city     - Get users by city
```

## File Structure
```
src/modules/users/
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   ├── update-password.dto.ts
│   ├── update-credit-score.dto.ts
│   └── upload-profile-image.dto.ts
├── entities/
│   └── user.entity.ts
├── services/
│   └── file-upload.service.ts
├── users.controller.ts
├── users.service.ts
└── users.module.ts
```

## Configuration

### Environment Variables
```env
# File Upload Configuration
UPLOAD_MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DESTINATION=./uploads/profiles
```

### Multer Configuration
- **Storage**: Memory storage for validation before filesystem save
- **File Size**: 5MB maximum
- **File Types**: JPEG, PNG, GIF, WebP only
- **Directory**: `./uploads/profiles/`

## Security Features

### Access Control
- **Authentication**: JWT-based authentication required
- **Authorization**: Role-based access control (RBAC)
- **Account Status**: Status-based access restrictions
- **File Validation**: Strict file type and size validation

### Validation Rules
- **Email**: Valid email format required
- **Password**: Strong password requirements (8+ chars, mixed case, numbers, symbols)
- **Phone**: International format validation
- **File Upload**: MIME type and size validation

## Error Handling

### Exception Types
- **NotFoundException**: User not found scenarios
- **ConflictException**: Duplicate email/phone scenarios
- **BadRequestException**: Invalid input or file upload errors
- **UnauthorizedException**: Authentication failures

### Response Formats
```json
{
  "statusCode": 400,
  "message": "File size too large. Maximum size is 5MB",
  "error": "Bad Request"
}
```

## Usage Examples

### Upload Profile Image
```typescript
// Controller usage
@Post('profile/:id/image')
@UseInterceptors(FileInterceptor('profileImage'))
uploadProfileImage(@Param('id') id: string, @UploadedFile() file: any) {
  return this.usersService.uploadProfileImage(id, file);
}
```

### Account Management
```typescript
// Deactivate account
await usersService.deactivateAccount(userId);

// Reactivate account
await usersService.reactivateAccount(userId);

// Check qualification status
const qualification = await growthManagementService.checkGrowthQualification(userId);
```

## Testing
- **Unit Tests**: Service method testing
- **Integration Tests**: Controller endpoint testing
- **File Upload Tests**: Multer integration testing
- **Error Scenarios**: Comprehensive error handling testing

## Dependencies
- **@nestjs/platform-express**: Express platform with multer support
- **multer**: File upload middleware
- **@types/multer**: TypeScript definitions
- **class-validator**: Input validation
- **bcrypt**: Password hashing
- **mongoose**: MongoDB object modeling

## Status: ✅ 100% COMPLETE
All user account management features have been successfully implemented and tested.
