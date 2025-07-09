import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Inject, 
  UseGuards, 
  ParseIntPipe,
  Req
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../../guards/auth/auth.guard';
import { ORDER_SERVICE_RABBITMQ } from '../../constants';
import { CreateOrderDto, CreateOrderWithLockDto } from './dto/orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(ORDER_SERVICE_RABBITMQ) private readonly ordersClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const userId = req.user.userId;
    
    const orderData = {
      ...createOrderDto,
      userId: userId,
    };

    return await firstValueFrom(
      this.ordersClient.send('create-order', orderData)
    );
  }

  @Post('with-lock')
  @UseGuards(AuthGuard)
  async createOrderWithLock(@Body() createOrderDto: CreateOrderWithLockDto, @Req() req) {
    const userId = req.user.userId;
    
    const orderData = {
      ...createOrderDto,
      userId: userId,
    };

    return await firstValueFrom(
      this.ordersClient.send('create-order-with-lock', orderData)
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  async getMyOrders(@Req() req) {
    const userId = req.user.userId;
    
    return await firstValueFrom(
      this.ordersClient.send('get-orders-by-user', userId)
    );
  }

  @Get('all')
  @UseGuards(AuthGuard)
  async getAllOrders() {
    return await firstValueFrom(
      this.ordersClient.send('get-all-orders', {})
    );
  }

  @Get('event/:eventId')
  @UseGuards(AuthGuard)
  async getOrdersByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return await firstValueFrom(
      this.ordersClient.send('get-orders-by-event', eventId)
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrderById(@Param('id', ParseIntPipe) id: number) {
    return await firstValueFrom(
      this.ordersClient.send('get-order-by-id', id)
    );
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard)
  async cancelOrder(@Param('id', ParseIntPipe) id: number) {
    return await firstValueFrom(
      this.ordersClient.send('cancel-order', id)
    );
  }
}
