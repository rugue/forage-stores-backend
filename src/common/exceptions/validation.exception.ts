import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class ValidationException extends BadRequestException {
  constructor(
    public validationErrors: ValidationError[],
  ) {
    super({
      message: 'Validation failed',
      errors: validationErrors.map(error => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value,
      })),
    });
  }
}
