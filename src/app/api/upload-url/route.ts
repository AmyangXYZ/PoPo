export async function POST(request: Request) {
  const { url } = await request.json()
  return Response.json({ url })
}
