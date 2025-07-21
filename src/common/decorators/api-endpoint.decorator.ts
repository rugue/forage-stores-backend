import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiEndpoint(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}

export function ApiPublicEndpoint(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}

export function ApiCreateEndpoint(entity: string, type: any) {
  return applyDecorators(
    ApiOperation({ summary: `Create a new ${entity}` }),
    ApiResponse({
      status: 201,
      description: `${entity} created successfully`,
      type,
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiBearerAuth('JWT-auth'),
  );
}

export function ApiGetEndpoint(entity: string, type: any) {
  return applyDecorators(
    ApiOperation({ summary: `Get ${entity}` }),
    ApiResponse({
      status: 200,
      description: `Returns ${entity}`,
      type,
    }),
    ApiResponse({ status: 404, description: 'Not found' }),
    ApiBearerAuth('JWT-auth'),
  );
}

export function ApiUpdateEndpoint(entity: string, type: any) {
  return applyDecorators(
    ApiOperation({ summary: `Update ${entity}` }),
    ApiResponse({
      status: 200,
      description: `${entity} updated successfully`,
      type,
    }),
    ApiResponse({ status: 404, description: 'Not found' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiBearerAuth('JWT-auth'),
  );
}

export function ApiDeleteEndpoint(entity: string, type: any) {
  return applyDecorators(
    ApiOperation({ summary: `Delete ${entity}` }),
    ApiResponse({
      status: 200,
      description: `${entity} deleted successfully`,
      type,
    }),
    ApiResponse({ status: 404, description: 'Not found' }),
    ApiBearerAuth('JWT-auth'),
  );
}
