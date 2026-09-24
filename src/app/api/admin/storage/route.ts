import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cached: { expiresAt: number; data: { packages: number; bytes: number; latest: string | null; scannedAt: string } } | undefined;

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json(cached.data);
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return NextResponse.json({ error: "Storage connection is not configured" }, { status: 503 });
  const client = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
  let token: string | undefined;
  let packages = 0;
  let bytes = 0;
  let latest: Date | undefined;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "fonts/bundles/", ContinuationToken: token }));
    for (const object of page.Contents || []) {
      if (!object.Key?.endsWith(".zip")) continue;
      packages += 1;
      bytes += object.Size || 0;
      if (object.LastModified && (!latest || object.LastModified > latest)) latest = object.LastModified;
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  const data = { packages, bytes, latest: latest?.toISOString() || null, scannedAt: new Date().toISOString() };
  cached = { expiresAt: Date.now() + 15 * 60 * 1000, data };
  return NextResponse.json(data);
}
