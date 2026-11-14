import { createSign } from "node:crypto";

/**
 * Google Cloud のサービスアカウント鍵（JSON）からアクセストークンを取る。
 * 外部ライブラリを使わず、JWT を署名して OAuth のトークンと交換する。
 * 環境変数 GOOGLE_CLOUD_CREDENTIALS に、ダウンロードした JSON の中身をそのまま入れる。
 */

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
}

let cached: { token: string; expiresAt: number; email: string } | null = null;

export function parseServiceAccount(raw: string): ServiceAccountKey {
  let json: ServiceAccountKey;
  try {
    // 前後の空白や、base64 で入れた場合にも対応
    const text = raw.trim().startsWith("{") ? raw.trim() : Buffer.from(raw.trim(), "base64").toString("utf8");
    json = JSON.parse(text);
  } catch {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS が JSON として読めません。ダウンロードした鍵ファイルの中身をそのまま貼ってください。");
  }
  if (!json.client_email || !json.private_key || !json.project_id) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS にサービスアカウント鍵の項目（client_email / private_key / project_id）がありません。");
  }
  // 貼り付け時に改行が \n の文字列になっていても動くようにする
  json.private_key = json.private_key.replace(/\\n/g, "\n");
  return json;
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

export async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.email === sa.client_email && cached.expiresAt - 60 > now) return cached.token;

  const tokenUri = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const json = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error_description?: string } | null;
  if (!res.ok || !json?.access_token) {
    console.error("[tryon/google-auth]", res.status, json?.error_description);
    throw new Error("Google Cloud の認証に失敗しました（サービスアカウント鍵を確認してください）。");
  }
  cached = { token: json.access_token, expiresAt: now + (json.expires_in ?? 3600), email: sa.client_email };
  return json.access_token;
}
