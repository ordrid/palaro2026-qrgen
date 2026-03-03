import QRCode from "qrcode";
import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const url = formData.get("url");
  const logoFile = formData.get("logo") as File | null;

  if (!url || typeof url !== "string" || !url.trim()) {
    return new Response(JSON.stringify({ error: "URL is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const qrSize = 500;
  const logoSize = Math.floor(qrSize * 0.25);

  const qrBuffer = await QRCode.toBuffer(url.trim(), {
    errorCorrectionLevel: "H",
    width: qrSize,
    margin: 2,
  });

  let logoBuffer: Buffer;
  if (logoFile && logoFile.size > 0) {
    const arrayBuffer = await logoFile.arrayBuffer();
    logoBuffer = Buffer.from(arrayBuffer);
  } else {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    logoBuffer = await readFile(logoPath);
  }

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${logoSize}" height="${logoSize}">
      <circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="white" />
    </svg>`
  );

  const circularLogo = await sharp(resizedLogo)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const bgSize = logoSize + 30;

  const whiteCircleBg = await sharp({
    create: {
      width: bgSize,
      height: bgSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${bgSize}" height="${bgSize}">
            <circle cx="${bgSize / 2}" cy="${bgSize / 2}" r="${bgSize / 2}" fill="white" />
          </svg>`
        ),
      },
      { input: circularLogo, gravity: "center" },
    ])
    .png()
    .toBuffer();

  const finalImage = await sharp(qrBuffer)
    .composite([{ input: whiteCircleBg, gravity: "center" }])
    .png()
    .toBuffer();

  return new Response(new Uint8Array(finalImage), {
    status: 200,
    headers: { "Content-Type": "image/png" },
  });
}
