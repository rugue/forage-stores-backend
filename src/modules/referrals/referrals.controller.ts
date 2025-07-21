import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import {
  CreateReferralDto,
  ProcessCommissionDto,
  ReferralFilterDto,
  UpdateReferralDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new referral' })
  @ApiResponse({ status: 201, description: 'Referral created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createReferralDto: CreateReferralDto) {
    return this.referralsService.create(createReferralDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all referrals (admin only)' })
  @ApiResponse({ status: 200, description: 'Return all referrals' })
  async findAll(@Query() filterDto: ReferralFilterDto) {
    return this.referralsService.findAll(filterDto);
  }

  @Get('my-referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all referrals made by current user' })
  @ApiResponse({ status: 200, description: 'Return user referrals' })
  async findMyReferrals(@CurrentUser() user: any) {
    return this.referralsService.findAllByReferrer(user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral statistics for current user' })
  @ApiResponse({ status: 200, description: 'Return referral statistics' })
  async getMyStats(@CurrentUser() user: any) {
    return this.referralsService.getReferralStats(user.userId);
  }

  @Get('generate-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate referral code for current user' })
  @ApiResponse({ status: 200, description: 'Return generated referral code' })
  async generateCode(@CurrentUser() user: any) {
    const code = await this.referralsService.generateReferralCode(user.userId);
    return { referralCode: code };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a referral by ID' })
  @ApiResponse({ status: 200, description: 'Return the referral' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async findOne(@Param('id') id: string) {
    return this.referralsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a referral (admin only)' })
  @ApiResponse({ status: 200, description: 'Referral updated successfully' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async update(
    @Param('id') id: string,
    @Body() updateReferralDto: UpdateReferralDto,
  ) {
    return this.referralsService.update(id, updateReferralDto);
  }

  @Post('process-commission/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SYSTEM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process commission for a purchase (admin/system only)' })
  @ApiResponse({ status: 200, description: 'Commission processed successfully' })
  async processCommission(
    @Param('userId') userId: string,
    @Body() processDto: ProcessCommissionDto,
  ) {
    return this.referralsService.processCommission(userId, processDto);
  }
}
