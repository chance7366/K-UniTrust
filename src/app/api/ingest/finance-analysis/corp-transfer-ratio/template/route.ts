import { bufferResponseBody } from "@/lib/http/response-body";

import { buildCorpTransferRatioTemplateBuffer } from "@/lib/ingest/corp-transfer-ratio-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = buildCorpTransferRatioTemplateBuffer();
  return new Response(bufferResponseBody(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="corp_transfer_ratio_upload_template.xlsx"',
    },
  });
}
