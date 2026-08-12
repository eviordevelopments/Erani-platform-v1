import { Resend } from 'resend';
import { DataRoomInviteEmail } from '@/components/emails/DataRoomInviteEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      to, 
      dataRoomName, 
      dataRoomDesc, 
      collectionName, 
      inviterName, 
      inviterRole, 
      inviterAvatarUrl, 
      organizationName, 
      dataRoomUrl 
    } = body;

    if (!to || !to.length) {
      return new Response(JSON.stringify({ error: "No recipients provided" }), { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'Erani Platform <notificaciones@platform.erani.mx>',
      to: to,
      subject: `Invitación al Data Room: ${dataRoomName}`,
      react: DataRoomInviteEmail({
        dataRoomName,
        dataRoomDesc,
        collectionName,
        inviterName,
        inviterRole,
        inviterAvatarUrl,
        organizationName,
        dataRoomUrl
      }) as React.ReactElement,
    });

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error("Resend Data Room Invite Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
