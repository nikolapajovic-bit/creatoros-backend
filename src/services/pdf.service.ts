import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { cloudinary } from "@/config/cloudinary";
import type { IContract } from "@/modules/contracts/contract.model";

const LOGO_PATH = path.join(
  process.cwd(),
  "..",
  "frontend",
  "public",
  "logo-full-1.png",
);

function normalizeText(text: string): string {
  return text.replace(/\\n/g, "\n").trim();
}

function drawHeader(doc: PDFKit.PDFDocument) {
  const hasLogo = fs.existsSync(LOGO_PATH);
  const startY = doc.y;

  if (hasLogo) {
    doc.image(
      LOGO_PATH,
      doc.page.width - doc.page.margins.right - 110,
      startY,
      {
        fit: [110, 26],
        align: "right",
      },
    );
    doc.y = startY + 34;
  } else {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#888")
      .text("CreatorOS", { align: "right" });
    doc.moveDown(1);
  }
}

/**
 * Preuzima sliku sa udaljenog URL-a (Cloudinary) u memoriju kao Buffer —
 * pdfkit ume da ugradi Buffer direktno, ne treba fajl na disku.
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export async function generateSignedContractPdf(
  contract: IContract,
): Promise<string> {
  // Unapred preuzmi slike potpisa (mrežni pozivi) PRE nego što počnemo da pišemo PDF —
  // pdfkit piše sinhrono u stream, ne možemo da "pauziramo" usred pisanja da čekamo fetch
  const creatorSigBuffer = contract.creatorSignature?.signatureImageUrl
    ? await fetchImageBuffer(contract.creatorSignature.signatureImageUrl)
    : null;
  const brandSigBuffer = contract.brandSignature?.signatureImageUrl
    ? await fetchImageBuffer(contract.brandSignature.signatureImageUrl)
    : null;

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // --- Header ---
    drawHeader(doc);

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#111")
      .text(contract.title);
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#666")
      .text(`Brand: ${contract.brand}`);
    doc.moveDown(0.3);
    doc
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#ddd")
      .stroke();
    doc.moveDown(1.5);

    const paragraphs = normalizeText(contract.bodyText).split(/\n\s*\n/);
    doc.fontSize(11).font("Helvetica").fillColor("#222");
    for (const paragraph of paragraphs) {
      const cleanParagraph = paragraph.replace(/\n/g, " ").trim();
      if (!cleanParagraph) continue;
      doc.text(cleanParagraph, { align: "justify", lineGap: 3 });
      doc.moveDown(0.8);
    }

    doc.moveDown(1);
    doc
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#ddd")
      .stroke();
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#111");
    doc.text(`Value:  ${contract.value} ${contract.currency}`);
    doc.text(
      `Expiry date:  ${contract.expiryDate.toLocaleDateString("en-US")}`,
    );

    // --- Strana 2: Certificate of Completion ---
    doc.addPage();
    drawHeader(doc);
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#111")
      .text("Certificate of Completion");
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666")
      .text(
        "This certificate provides a record of the electronic signature process for this document.",
      );
    doc.moveDown(1.5);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#111")
      .text("Document Integrity");
    doc.moveDown(0.2);
    doc
      .fontSize(9)
      .font("Courier")
      .fillColor("#555")
      .text(`SHA-256   ${contract.documentHash}`);
    doc.moveDown(1.5);

    for (const [label, sig, imageBuffer] of [
      ["Creator Signature", contract.creatorSignature, creatorSigBuffer],
      ["Brand Signature", contract.brandSignature, brandSigBuffer],
    ] as const) {
      if (!sig) continue;

      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#eee")
        .stroke();
      doc.moveDown(0.8);

      doc.fontSize(11).font("Helvetica-Bold").fillColor("#111").text(label);
      doc.moveDown(0.4);

      if (imageBuffer) {
        doc.image(imageBuffer, { width: 160, height: 60 });
        doc.moveDown(0.4);
      }

      doc.fontSize(9).font("Helvetica").fillColor("#555");
      doc.text(`Signed by:   ${sig.fullName}`);
      doc.text(`Date/Time:   ${sig.timestamp.toISOString()}`);
      doc.text(`IP Address:  ${sig.ip}`);
      doc.text(`Consent:     "${sig.consentText}"`, { width: 480 });
      doc.moveDown(1.2);
    }

    doc.end();
  });

  // Otpremi gotov PDF na Cloudinary (resource_type: "raw" jer PDF nije slika)
  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "creatoros/contracts",
            public_id: `contract-${contract._id}-signed`,
            resource_type: "raw",
            format: "pdf",
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          },
        )
        .end(pdfBuffer);
    },
  );

  return uploadResult.secure_url;
}
