
import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Request, Get, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaClient } from '@prisma/client'
import { AuthGuard } from './auth.guard';
const prisma = new PrismaClient()
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}


    @HttpCode(HttpStatus.OK)
    @Post('register')
    sign(@Body('email') email: string, @Body('username') username: string, @Body('pass') pass: string) {
      return this.authService.sign(email, username, pass);
    }

    @Post('login')
    login(@Body('email') email: string, @Body('pass') pass: string) {
      return this.authService.login(email, pass);
    }
  
    @UseGuards(AuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
      let userId = req.user.id
      
      const getUser = await prisma.user.findUnique({
        where: {
          id: userId
        }
      })

      if(!getUser){
        throw new HttpException('Данный пользователь не найден', HttpStatus.BAD_REQUEST);
        return;
      };
      return getUser
    }

    @Post('refreshToken')
    refreshToken(@Body('refreshToken') refreshToken: string){
      return this.authService.refreshToken(refreshToken);
    }
}
