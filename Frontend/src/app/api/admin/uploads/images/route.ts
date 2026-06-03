import { NextResponse } from "next/server";

function resolveBackendBaseUrl() {
  const serverUrl = process.env.API_BASE_URL?.trim();
  if (serverUrl) return serverUrl;

  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (publicUrl) return publicUrl;

  if (process.env.NODE_ENV === "production") {
    return "https://api.billarenlinea.com";
  }

  return "http://localhost:3001";
}

export async function POST(request: Request) {
  const backendBaseUrl = resolveBackendBaseUrl();
  const incomingFormData = await request.formData();
  const forwardFormData = new FormData();

  for (const [key, value] of incomingFormData.entries()) {
    forwardFormData.append(key, value);
  }

  const headers = new Headers();
  const cookieHeader = request.headers.get("cookie");
  const authorizationHeader = request.headers.get("authorization");

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  if (authorizationHeader) {
    headers.set("authorization", authorizationHeader);
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${backendBaseUrl}/api/uploads/images`, {
      method: "POST",
      headers,
      body: forwardFormData,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible conectar con el backend.";
    return NextResponse.json(
      { ok: false, message: `Proxy de uploads sin conexion al backend. ${message}` },
      { status: 502 },
    );
  }

  const contentType = backendResponse.headers.get("content-type") ?? "application/json";
  const bodyBuffer = await backendResponse.arrayBuffer();

  return new Response(bodyBuffer, {
    status: backendResponse.status,
    headers: {
      "content-type": contentType,
    },
  });
}
