import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { EmailAlreadyRegisteredException } from '../common/exceptions/business.exceptions';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key === 'jwt.secret' ? 'secret' : '1d')) },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('creates a new user and returns an access token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    });

    it('throws a conflict exception when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(EmailAlreadyRegisteredException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns an access token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashedPassword });

      const result = await authService.login({
        email: 'john@example.com',
        password: 'Password123',
      });

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashedPassword });

      await expect(
        authService.login({ email: 'john@example.com', password: 'WrongPassword123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
