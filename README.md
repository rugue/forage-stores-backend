# Forage Stores Backend

A NestJS backend application for managing forage stores with MongoDB database integration.

## Features

- **NestJS Framework**: Modern Node.js framework with TypeScript support
- **MongoDB Database**: Flexible NoSQL database with Mongoose integration
- **API Documentation**: Swagger/OpenAPI documentation
- **Validation**: Request validation using class-validator
- **Environment Configuration**: dotenv support for environment variables
- **Code Quality**: ESLint and Prettier for code formatting

## Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- npm or yarn package manager

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up your MongoDB database and update the `.env` file with your database connection string:

```bash
MONGODB_URI=mongodb://localhost:27017/forage-stores
```

3. Run the application:

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
http://localhost:3000/api

## Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage

## Project Structure

```
src/
├── common/          # Shared utilities and common code
├── entities/        # Mongoose schema definitions
├── modules/         # Feature modules
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## Environment Variables

| Variable      | Description            | Default                                   |
| ------------- | ---------------------- | ----------------------------------------- |
| `PORT`        | Application port       | `3000`                                    |
| `NODE_ENV`    | Environment mode       | `development`                             |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/forage-stores` |

## License

This project is licensed under the UNLICENSED License.
