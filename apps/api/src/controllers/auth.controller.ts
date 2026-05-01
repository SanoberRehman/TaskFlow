import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateTokens, verifyRefreshToken } from '../lib/jwt';
import { BadRequestError, ConflictError, UnauthorizedError } from '../lib/errors';
import type { SignupInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '@taskflow/shared';

function sanitizeUser(user: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body as SignupInput;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const tokens = generateTokens({ userId: user.id, email: user.email });

    res.status(201).json({
      data: {
        user: sanitizeUser(user),
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestError('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new BadRequestError('Invalid email or password');
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });

    res.json({
      data: {
        user: sanitizeUser(user),
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });

    res.json({
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ data: { message: 'Logged out successfully' } });
}

export async function me(req: Request, res: Response) {
  res.json({ data: { user: sanitizeUser(req.user!) } });
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, avatarUrl } = req.body as UpdateProfileInput;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    res.json({ data: { user: sanitizeUser(user) } });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw new UnauthorizedError();
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ data: { message: 'Password changed successfully' } });
  } catch (error) {
    next(error);
  }
}
