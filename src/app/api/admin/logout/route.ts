import{cookies}from"next/headers";import{NextResponse}from"next/server";import{ADMIN_COOKIE,verifyAdminApi}from"@/lib/admin-auth";
export async function POST(request:Request){if(!await verifyAdminApi(request))return NextResponse.json({error:"Unauthorized."},{status:401});(await cookies()).delete(ADMIN_COOKIE);return NextResponse.json({message:"Signed out."})}
