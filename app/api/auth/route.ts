import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword, signToken } from '@/lib/auth';
import { query, getOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password } = body;

    if (!action || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: action, email, password' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (action === 'signup') {
      const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      const user = await getOne(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, passwordHash]
      );

      const token = signToken({ userId: user.id, email: user.email });

      return NextResponse.json({
        token,
        user: { id: user.id, email: user.email, created_at: user.created_at },
      }, { status: 201 });
    }

    if (action === 'login') {
      const user = await getOne('SELECT id, email, password_hash, created_at FROM users WHERE email = $1', [email]);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const token = signToken({ userId: user.id, email: user.email });

      return NextResponse.json({
        token,
        user: { id: user.id, email: user.email, created_at: user.created_at },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "signup" or "login".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
