import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        aud?: string;
      };
      profile?: {
        id: string;
        username: string;
        role: string;
        is_banned: boolean;
        avatar_url: string | null;
        balance: number;
        created_at: string;
        updated_at: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    if (profile.is_banned) {
      res.status(403).json({ error: 'Account is banned' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      aud: user.aud,
    };
    req.profile = profile;

    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.profile) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.profile.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}
