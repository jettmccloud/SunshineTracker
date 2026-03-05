import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword, signToken } from '@/lib/auth';
import { query, getOne } from '@/lib/db';
import crypto from 'crypto';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'forgot-password') {
      return handleForgotPassword(body);
    }

    if (action === 'reset-password') {
      return handleResetPassword(body);
    }

    const { email, password } = body;

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
      { error: 'Invalid action. Use "signup", "login", "forgot-password", or "reset-password".' },
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

async function handleForgotPassword(body: { email?: string }) {
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
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

  // Always return success to avoid revealing whether an account exists
  const successMessage = 'If an account exists with that email, we sent a password reset link.';

  const user = await getOne('SELECT id FROM users WHERE email = $1', [email]);
  if (!user) {
    return NextResponse.json({ message: successMessage });
  }

  // Rate limit: no token created for this user in last 5 minutes
  const recentToken = await getOne(
    'SELECT id FROM password_reset_tokens WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'5 minutes\'',
    [user.id]
  );
  if (recentToken) {
    return NextResponse.json({ message: successMessage });
  }

  // Generate token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Store with 1hr expiry
  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
    [user.id, tokenHash]
  );

  // Send email via Resend
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sunshinecasetracker.com';
  const resetLink = `${baseUrl}/auth/reset-password?token=${rawToken}`;

  try {
    await getResend().emails.send({
      from: 'noreply@sunshinecasetracker.com',
      to: email,
      subject: 'Reset your Sunshine Case Tracker password',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset for your Sunshine Case Tracker account.</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetLink}</p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send reset email:', emailError);
  }

  return NextResponse.json({ message: successMessage });
}

async function handleResetPassword(body: { token?: string; password?: string }) {
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and new password are required' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetToken = await getOne(
    'SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()',
    [tokenHash]
  );

  if (!resetToken) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetToken.user_id]);
  await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetToken.id]);

  return NextResponse.json({ message: 'Password has been reset successfully' });
}
