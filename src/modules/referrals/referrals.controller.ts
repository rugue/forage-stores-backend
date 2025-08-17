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
import { CommissionService } from './services/commission.service';
import { GrowthManagementService } from './services/growth-management.service';
import {
  CreateReferralDto,
  ProcessCommissionDto,
  ReferralFilterDto,
  UpdateReferralDto,
} from './dto';
import { CommissionQueryDto, GrowthQualificationDto, PromoteUserDto } from './dto/growth.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly commissionService: CommissionService,
    private readonly growthManagementService: GrowthManagementService,
  ) {}

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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all referrals (admin only)' })
  @ApiResponse({ status: 200, description: 'Return all referrals' })
  async findAll(@Query() filterDto: ReferralFilterDto) {
    return this.referralsService.findAll(filterDto);
  }

  @Get('my-referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all referrals made by current user' })
  @ApiResponse({ status: 200, description: 'Return user referrals' })
  async findMyReferrals(@CurrentUser() user: any) {
    return this.referralsService.findAllByReferrer(user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get referral statistics for current user' })
  @ApiResponse({ status: 200, description: 'Return referral statistics' })
  async getMyStats(@CurrentUser() user: any) {
    return this.referralsService.getReferralStats(user.userId);
  }

  @Get('generate-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate referral code for current user' })
  @ApiResponse({ status: 200, description: 'Return generated referral code' })
  async generateCode(@CurrentUser() user: any) {
    const code = await this.referralsService.generateReferralCode(user.userId);
    return { referralCode: code };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a referral by ID' })
  @ApiResponse({ status: 200, description: 'Return the referral' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async findOne(@Param('id') id: string) {
    return this.referralsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Process commission for a purchase (admin/system only)' })
  @ApiResponse({ status: 200, description: 'Commission processed successfully' })
  async processCommission(
    @Param('userId') userId: string,
    @Body() processDto: ProcessCommissionDto,
  ) {
    return this.referralsService.processCommission(userId, processDto);
  }

  // New Commission Endpoints
  @Get('commissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get commissions for current user' })
  @ApiResponse({ status: 200, description: 'Return user commissions' })
  async getMyCommissions(
    @CurrentUser() user: any,
    @Query() filters: CommissionQueryDto,
  ) {
    const filterOptions = {
      type: filters.type,
      status: filters.status,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.commissionService.getCommissionsByUser(user.userId, filterOptions);
  }

  @Get('commissions/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get commission statistics for current user' })
  @ApiResponse({ status: 200, description: 'Return commission statistics' })
  async getMyCommissionStats(@CurrentUser() user: any) {
    return this.commissionService.getCommissionStats(user.userId);
  }

  // Growth Management Endpoints
  @Get('growth/qualification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check growth qualification for current user' })
  @ApiResponse({ status: 200, description: 'Return growth qualification status' })
  async checkMyGrowthQualification(@CurrentUser() user: any) {
    return this.referralsService.getGrowthQualification(user.userId);
  }

  @Get('growth/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get overall growth statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Return growth statistics' })
  async getGrowthStats() {
    return this.growthManagementService.getGrowthStats();
  }

  @Post('growth/promote-ga')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Promote user to Growth Associate (admin only)' })
  @ApiResponse({ status: 200, description: 'User promoted to GA successfully' })
  async promoteToGA(@Body() promoteDto: PromoteUserDto) {
    return this.referralsService.promoteToGrowthAssociate(promoteDto.userId);
  }

  @Post('growth/promote-ge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Promote user to Growth Elite (admin only)' })
  @ApiResponse({ status: 200, description: 'User promoted to GE successfully' })
  async promoteToGE(@Body() promoteDto: PromoteUserDto) {
    return this.referralsService.promoteToGrowthElite(promoteDto.userId);
  }

  @Post('growth/check-all-qualifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check and promote all eligible users (admin only)' })
  @ApiResponse({ status: 200, description: 'Promotion check completed' })
  async checkAllQualifications() {
    return this.growthManagementService.checkAndPromoteAllEligibleUsers();
  }

  @Get('admin/commissions/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get commissions for specific user (admin only)' })
  @ApiResponse({ status: 200, description: 'Return user commissions' })
  async getUserCommissions(
    @Param('userId') userId: string,
    @Query() filters: CommissionQueryDto,
  ) {
    const filterOptions = {
      type: filters.type,
      status: filters.status,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.commissionService.getCommissionsByUser(userId, filterOptions);
  }

  @Post('admin/process-pending-commissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Process all pending commissions (admin only)' })
  @ApiResponse({ status: 200, description: 'Pending commissions processed' })
  async processPendingCommissions() {
    const processed = await this.commissionService.processPendingCommissions();
    return { processed };
  }
}
