import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'

import { genSalt, hash, compare } from 'bcryptjs';
import {sign, verify}  from 'jsonwebtoken';
const prisma = new PrismaClient()
@Injectable()



export class AuthService {

    async sign(email: string, username: string, pass: string): Promise<any> {
        try {

        const getUser = await prisma.user.findUnique({
            where: {
              email: email
            }
          })


          if(getUser){
            throw new HttpException('Данный пользователь уже существует', HttpStatus.BAD_REQUEST);
            return;
          }

          const password = pass
          const salt = await genSalt(10)
          const passwordHash = await hash(password, salt)

          const result = await prisma.user.create({
            data: {
              email: email,
              username: username,
              passwordHash: passwordHash,
              role: false
            }
          });
          

          const user = await prisma.user.findUnique({
            where: {
              email: email
            }
          })
  


          const userId = user.id
          const accessToken = sign({id: user.id},'chater',{expiresIn: '15m'})
          const refreshToken = sign({id: user.id},'chapter',{expiresIn: '30d'})

          const refreshAdd = await prisma.user.update({
            where: {
            id: userId
            },
            data: {
                refreshToken: refreshToken
            }
          });

          return {
            result,
            accessToken,
            refreshToken
          }

        } catch (e) {
            throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async login(email: string, pass: string): Promise<any> {
      try {
        const isUser = await prisma.user.findUnique({
          where: {
            email: email
          }
        })
        if(!isUser){
          throw new HttpException('Данный пользователь не найден', HttpStatus.BAD_REQUEST);
          return;
        }

        const isValidPass = await compare(pass, isUser.passwordHash)
          if(!isValidPass){
            throw new HttpException('Не верный логин или пароль', HttpStatus.BAD_REQUEST);
            return;
          }
          const accessToken = sign({id: isUser.id},'chater',{expiresIn: '15m'})
          const refreshToken = sign({id: isUser.id},'chapter',{expiresIn: '30d'})
 
          const refreshAdd = await prisma.user.update({
            where: {
            email: email
            },
            data: {
                refreshToken: refreshToken
            }
          });

          return {
            refreshAdd,
            accessToken
          }
          
      } catch (e) {
        throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    async refreshToken(refreshToken: string): Promise<any> {
      
      const refreshAdd = await prisma.user.findUnique({
        where: {
          refreshToken
        }
      });
    
      if (!refreshAdd) {
        throw new HttpException('Вы не авторизованы', HttpStatus.BAD_REQUEST);
      }
    
      const decoded = verify(refreshToken, 'chapter');
      if (!decoded) {
        throw new HttpException('Токен не валидный', HttpStatus.BAD_REQUEST);
      }
    
      const newAccessToken = sign({ id: refreshAdd.id }, 'chater', { expiresIn: '15m' });
      const newRefreshToken = sign({id: refreshAdd.id},'chapter',{expiresIn: '30d'})
      return {
        newAccessToken,
        newRefreshToken
      };
    }
    
}
