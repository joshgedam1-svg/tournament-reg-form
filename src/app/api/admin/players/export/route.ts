import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/adminAuth';
import { playerService } from '@/services/player.service';
import { buildPlayersWorkbookBuffer } from '@/lib/exportPlayersExcel';
import { PlayerWithPayment } from '@/types/player';

async function generateExcelResponse(players: PlayerWithPayment[]) {
  const buffer = await buildPlayersWorkbookBuffer(players);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `CAL_Players_Export_${dateStamp}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;

    const players = await playerService.getPlayers({ status, role, search });
    return await generateExcelResponse(players);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to export players';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let players: PlayerWithPayment[] = [];

    if (Array.isArray(body.players) && body.players.length > 0) {
      players = body.players;
    } else {
      players = await playerService.getPlayers();
      if (Array.isArray(body.ids) && body.ids.length > 0) {
        const idSet = new Set<string>(body.ids);
        players = players.filter(p => idSet.has(p.id));
      }
    }

    if (players.length === 0) {
      return NextResponse.json(
        { error: 'No player records found to export' },
        { status: 404 }
      );
    }

    return await generateExcelResponse(players);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to export players';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
