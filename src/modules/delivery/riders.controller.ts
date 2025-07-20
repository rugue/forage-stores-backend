import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RidersService } from './riders.service';
import {
  CreateRiderDto,
  UpdateRiderDto,
  AddVerificationDocumentDto,
  VerifyDocumentDto,
  UpdateLocationDto,
  RiderFilterDto,
  UpdateSecurityDepositDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('riders')
@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a rider profile' })
  @ApiResponse({ status: 201, description: 'The rider profile has been successfully created' })
  async create(@Body() createRiderDto: CreateRiderDto, @CurrentUser() user: any) {
    // If user is creating their own rider profile, use their ID
    if (!createRiderDto.userId && user) {
      createRiderDto.userId = user.id;
    }
    return this.ridersService.create(createRiderDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all riders with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns all riders matching the filter criteria' })
  async findAll(@Query() filterDto: RiderFilterDto) {
    return this.ridersService.findAll(filterDto);
  }

  @Get('eligible')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get eligible riders for a specific city' })
  @ApiResponse({ status: 200, description: 'Returns eligible riders for delivery assignments' })
  async findEligibleRiders(@Query('city') city: string) {
    return this.ridersService.findEligibleRiders(city);
  }

  @Get('my-profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the current user\'s rider profile' })
  @ApiResponse({ status: 200, description: 'Returns the rider profile' })
  @ApiResponse({ status: 404, description: 'Rider profile not found' })
  async findMyProfile(@CurrentUser() user: any) {
    return this.ridersService.findByUserId(user.id);
  }

  @Get('deposit-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check security deposit requirement status' })
  @ApiResponse({ status: 200, description: 'Returns security deposit status' })
  async checkDepositStatus(@CurrentUser() user: any) {
    const rider = await this.ridersService.findByUserId(user.id);
    return this.ridersService.checkSecurityDepositRequirement(rider['_id'].toString());
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a rider profile by ID' })
  @ApiResponse({ status: 200, description: 'Returns the rider profile' })
  @ApiResponse({ status: 404, description: 'Rider not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Regular users can only view their own rider profile
    if (user.role !== UserRole.ADMIN && !user.roles?.includes(UserRole.ADMIN)) {
      const rider = await this.ridersService.findByUserId(user.id);
      if (rider['_id'].toString() !== id) {
        return this.ridersService.findByUserId(user.id);
      }
    }
    return this.ridersService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a rider profile' })
  @ApiResponse({ status: 200, description: 'The rider profile has been successfully updated' })
  @ApiResponse({ status: 404, description: 'Rider not found' })
  async update(
    @Param('id') id: string,
    @Body() updateRiderDto: UpdateRiderDto,
    @CurrentUser() user: any,
  ) {
    // Check if user has admin role or is updating their own profile
    const isAdmin = user.role === UserRole.ADMIN || user.roles?.includes(UserRole.ADMIN);
    
    if (!isAdmin) {
      // Regular riders can't update their status
      delete updateRiderDto.status;
      
      // Make sure they're updating their own profile
      const rider = await this.ridersService.findByUserId(user.id);
      if (rider['_id'].toString() !== id) {
        return this.ridersService.findByUserId(user.id);
      }
    }
    
    return this.ridersService.update(id, updateRiderDto);
  }

  @Post(':id/documents')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a verification document to rider profile' })
  @ApiResponse({ status: 201, description: 'The document has been successfully added' })
  @ApiResponse({ status: 404, description: 'Rider not found' })
  async addDocument(
    @Param('id') id: string,
    @Body() addDocumentDto: AddVerificationDocumentDto,
    @CurrentUser() user: any,
  ) {
    // Regular riders can only add documents to their own profile
    if (user.role !== UserRole.ADMIN && !user.roles?.includes(UserRole.ADMIN)) {
      const rider = await this.ridersService.findByUserId(user.id);
      if (rider['_id'].toString() !== id) {
        return this.ridersService.findByUserId(user.id);
      }
    }
    
    return this.ridersService.addVerificationDocument(id, addDocumentDto);
  }

  @Patch(':id/documents/:index')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify a document (admin only)' })
  @ApiResponse({ status: 200, description: 'The document has been successfully verified' })
  @ApiResponse({ status: 404, description: 'Rider or document not found' })
  async verifyDocument(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() verifyDocumentDto: VerifyDocumentDto,
  ) {
    return this.ridersService.verifyDocument(id, +index, verifyDocumentDto);
  }

  @Patch(':id/location')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update rider\'s current location' })
  @ApiResponse({ status: 200, description: 'The location has been successfully updated' })
  @ApiResponse({ status: 404, description: 'Rider not found' })
  async updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @CurrentUser() user: any,
  ) {
    // Regular riders can only update their own location
    if (user.role !== UserRole.ADMIN && !user.roles?.includes(UserRole.ADMIN)) {
      const rider = await this.ridersService.findByUserId(user.id);
      if (rider['_id'].toString() !== id) {
        return this.ridersService.findByUserId(user.id);
      }
    }
    
    return this.ridersService.updateLocation(id, updateLocationDto);
  }

  @Patch(':id/security-deposit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update rider\'s security deposit (admin only)' })
  @ApiResponse({ status: 200, description: 'The security deposit has been successfully updated' })
  @ApiResponse({ status: 404, description: 'Rider not found' })
  async updateSecurityDeposit(
    @Param('id') id: string,
    @Body() updateDepositDto: UpdateSecurityDepositDto,
  ) {
    return this.ridersService.updateSecurityDeposit(id, updateDepositDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a rider profile (admin only)' })
  @ApiResponse({ status: 200, description: 'The rider profile has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Rider not found' })
  async remove(@Param('id') id: string) {
    return this.ridersService.delete(id);
  }
}
