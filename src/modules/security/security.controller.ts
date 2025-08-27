import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpStatus,
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { TwoFactorAuthGuard } from './guards/two-factor-auth.guard';
import { 
  SecurityAuditService, 
  TwoFactorAuthService, 
  ThreatDetectionService, 
  SecurityAnalyticsService 
} from './services';
import {
  TwoFactorSetupDto,
  TwoFactorVerifyDto,
  CreateAuditLogDto,
  UpdateAuditLogStatusDto,
  AuditLogFilterDto,
  CreateThreatDetectionDto,
  ThreatDetectionFilterDto,
  SecurityAnalyticsFilterDto,
  SecurityDashboardDto
} from './dto/security.dto';

@ApiTags('Security')
@Controller('security')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SecurityController {
  constructor(
    private readonly auditService: SecurityAuditService,
    private readonly twoFactorService: TwoFactorAuthService,
    private readonly threatService: ThreatDetectionService,
    private readonly analyticsService: SecurityAnalyticsService,
  ) {}

  // Two-Factor Authentication Endpoints

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Setup two-factor authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA setup initiated' })
  async setupTwoFactor(@Request() req, @Body() setupDto: TwoFactorSetupDto) {
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.twoFactorService.setupTwoFactor(userId, setupDto, ipAddress, userAgent);
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify two-factor authentication setup' })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA setup verified' })
  async verifyTwoFactorSetup(@Request() req, @Body() verifyDto: TwoFactorVerifyDto) {
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.twoFactorService.verifyTwoFactorSetup(userId, verifyDto, ipAddress, userAgent);
  }

  @Post('2fa/authenticate')
  @ApiOperation({ summary: 'Authenticate with two-factor code' })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA authentication successful' })
  async authenticateTwoFactor(@Request() req, @Body() { code }: { code: string }) {
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.twoFactorService.verifyTwoFactorCode(userId, code, ipAddress, userAgent);
  }

  @Delete('2fa/disable')
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA disabled successfully' })
  async disableTwoFactor(@Request() req, @Body() { reason }: { reason?: string }) {
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    await this.twoFactorService.disableTwoFactor(userId, undefined, reason, ipAddress, userAgent);
    return { message: '2FA disabled successfully' };
  }

  @Post('2fa/backup-codes/regenerate')
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Backup codes regenerated' })
  async regenerateBackupCodes(@Request() req) {
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const backupCodes = await this.twoFactorService.regenerateBackupCodes(userId, ipAddress, userAgent);
    return { backupCodes };
  }

  @Get('2fa/status')
  @ApiOperation({ summary: 'Get two-factor authentication status' })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA status retrieved' })
  async getTwoFactorStatus(@Request() req) {
    const userId = req.user.id;
    return this.twoFactorService.getTwoFactorStatus(userId);
  }

  // Security Audit Endpoints

  @Post('audit/log')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create security audit log entry' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Audit log created' })
  async createAuditLog(@Request() req, @Body() createDto: CreateAuditLogDto) {
    const adminId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.auditService.createAuditLog({
      ...createDto,
      adminId,
      ipAddress,
      userAgent
    });
  }

  @Get('audit/logs')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get security audit logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit logs retrieved' })
  async getAuditLogs(@Query() filterDto: AuditLogFilterDto) {
    return this.auditService.getAuditLogs(filterDto);
  }

  @Get('audit/logs/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get specific audit log entry' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit log retrieved' })
  async getAuditLogById(@Param('id') id: string) {
    return this.auditService.getAuditLogById(id);
  }

  @Put('audit/logs/:id/status')
  @UseGuards(AdminGuard, TwoFactorAuthGuard)
  @ApiOperation({ summary: 'Update audit log status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit log status updated' })
  async updateAuditLogStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAuditLogStatusDto,
    @Request() req
  ) {
    const resolvedBy = req.user.id;
    return this.auditService.updateAuditLogStatus(id, updateDto, resolvedBy);
  }

  @Get('audit/critical')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get critical security events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Critical events retrieved' })
  async getCriticalEvents(@Query('limit') limit?: number) {
    return this.auditService.getCriticalEvents(limit || 10);
  }

  @Delete('audit/cleanup')
  @UseGuards(AdminGuard, TwoFactorAuthGuard)
  @ApiOperation({ summary: 'Clean up old audit logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Old audit logs cleaned up' })
  async cleanupOldLogs() {
    return this.auditService.cleanupOldLogs();
  }

  // Threat Detection Endpoints

  @Get('threats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get threat detections' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Threats retrieved' })
  async getThreats(@Query() filterDto: ThreatDetectionFilterDto) {
    return this.threatService.getThreats(filterDto);
  }

  @Post('threats/analyze')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Analyze security event for threats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event analyzed' })
  async analyzeSecurityEvent(@Body() eventData: any, @Request() req) {
    const { eventType, userId, metadata } = eventData;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.threatService.analyzeSecurityEvent(
      eventType, 
      userId, 
      ipAddress, 
      userAgent, 
      metadata
    );
  }

  @Post('threats/block-ip')
  @UseGuards(AdminGuard, TwoFactorAuthGuard)
  @ApiOperation({ summary: 'Block IP address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'IP blocked successfully' })
  async blockIP(@Body() { ipAddress, reason, duration }: { 
    ipAddress: string; 
    reason: string; 
    duration?: number;
  }) {
    await this.threatService.blockIP(ipAddress, reason, duration);
    return { message: `IP ${ipAddress} blocked successfully` };
  }

  @Delete('threats/unblock-ip/:ip')
  @UseGuards(AdminGuard, TwoFactorAuthGuard)
  @ApiOperation({ summary: 'Unblock IP address' })
  @ApiResponse({ status: HttpStatus.OK, description: 'IP unblocked successfully' })
  async unblockIP(@Param('ip') ipAddress: string) {
    this.threatService.unblockIP(ipAddress);
    return { message: `IP ${ipAddress} unblocked successfully` };
  }

  @Get('threats/analytics')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get threat analytics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Threat analytics retrieved' })
  async getThreatAnalytics(@Query('days') days?: number) {
    return this.threatService.getThreatAnalytics(days || 30);
  }

  @Delete('threats/cleanup')
  @UseGuards(AdminGuard, TwoFactorAuthGuard)
  @ApiOperation({ summary: 'Clean up old threat records' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Old threats cleaned up' })
  async cleanupOldThreats() {
    return this.threatService.cleanupOldThreats();
  }

  // Security Analytics Endpoints

  @Get('dashboard')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get security dashboard data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard data retrieved' })
  async getSecurityDashboard(@Query() dashboardDto: SecurityDashboardDto) {
    const days = dashboardDto.days || 7;
    return this.analyticsService.getSecurityDashboard(days);
  }

  @Get('metrics')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get security metrics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Security metrics retrieved' })
  async getSecurityMetrics(@Query('days') days?: number) {
    return this.analyticsService.calculateSecurityMetrics(days || 30);
  }

  @Get('report')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Generate security report' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Security report generated' })
  async generateSecurityReport(@Query() filterDto: SecurityAnalyticsFilterDto) {
    return this.analyticsService.generateSecurityReport(filterDto);
  }

  @Get('status/realtime')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get real-time security status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Real-time status retrieved' })
  async getRealTimeStatus() {
    return this.analyticsService.getRealTimeSecurityStatus();
  }

  // Admin-only 2FA Management

  @Get('admin/2fa/users')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get users with 2FA enabled' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users with 2FA retrieved' })
  async getUsersWithTwoFactor() {
    return this.twoFactorService.getUsersWithTwoFactor();
  }

  @Delete('admin/2fa/disable/:userId')
  @UseGuards(AdminGuard, TwoFactorAuthGuard)
  @ApiOperation({ summary: 'Disable 2FA for a user (admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User 2FA disabled' })
  async adminDisableTwoFactor(
    @Param('userId') userId: string,
    @Body() { reason }: { reason: string },
    @Request() req
  ) {
    const adminId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    await this.twoFactorService.disableTwoFactor(userId, adminId, reason, ipAddress, userAgent);
    return { message: `2FA disabled for user ${userId}` };
  }
}
