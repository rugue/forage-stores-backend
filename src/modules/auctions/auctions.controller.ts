import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  UseGuards,
  Query,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { 
  CreateAuctionDto, 
  UpdateAuctionDto, 
  PlaceBidDto,
  AuctionFilterDto,
  AuctionResponseDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new auction' })
  @ApiResponse({ status: 201, description: 'The auction has been successfully created', type: AuctionResponseDto })
  async create(@Body() createAuctionDto: CreateAuctionDto) {
    return this.auctionsService.create(createAuctionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all auctions with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns all auctions matching the filter criteria', type: [AuctionResponseDto] })
  async findAll(@Query() filterDto: AuctionFilterDto) {
    return this.auctionsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find auction by ID' })
  @ApiResponse({ status: 200, description: 'Returns the auction with the specified ID', type: AuctionResponseDto })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }
  
  @Get('user/bids')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get auctions the current user has bid on' })
  @ApiResponse({ status: 200, description: 'Returns all auctions the current user has bid on', type: [AuctionResponseDto] })
  async getUserBids(@CurrentUser() user: any) {
    return this.auctionsService.findUserBids(user.id);
  }
  
  @Get('user/won')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get auctions the current user has won' })
  @ApiResponse({ status: 200, description: 'Returns all auctions the current user has won', type: [AuctionResponseDto] })
  async getUserWonAuctions(@CurrentUser() user: any) {
    return this.auctionsService.findUserWonAuctions(user.id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an auction' })
  @ApiResponse({ status: 200, description: 'The auction has been successfully updated', type: AuctionResponseDto })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async update(
    @Param('id') id: string, 
    @Body() updateAuctionDto: UpdateAuctionDto,
    @CurrentUser() user: any
  ) {
    return this.auctionsService.update(id, updateAuctionDto, user.role);
  }

  @Post(':id/bid')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Place a bid on an auction' })
  @ApiResponse({ status: 200, description: 'Bid successfully placed', type: AuctionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid bid' })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async placeBid(
    @Param('id') auctionId: string,
    @Body() bidDto: PlaceBidDto,
    @CurrentUser() user: any
  ) {
    return this.auctionsService.placeBid(auctionId, user.id, bidDto);
  }
  
  @Post(':id/cancel')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel an auction and refund all bids' })
  @ApiResponse({ status: 200, description: 'Auction successfully cancelled', type: AuctionResponseDto })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async cancelAuction(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.auctionsService.cancelAuction(id, user.role);
  }
  
  @Post(':id/finalize')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually finalize an auction' })
  @ApiResponse({ status: 200, description: 'Auction successfully finalized', type: AuctionResponseDto })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async finalizeAuction(@Param('id') id: string) {
    return this.auctionsService.finalizeAuction(id);
  }
}
