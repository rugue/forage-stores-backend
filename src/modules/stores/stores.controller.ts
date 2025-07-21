import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { Store } from './entities/store.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully',
    type: Store,
  })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores' })
  @ApiResponse({ status: 200, description: 'Return all stores', type: [Store] })
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a store by id' })
  @ApiResponse({ status: 200, description: 'Return the store', type: Store })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a store' })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully',
    type: Store,
  })
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a store' })
  @ApiResponse({
    status: 200,
    description: 'Store deleted successfully',
    type: Store,
  })
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
