import { Types } from "mongoose";
import { Invoice } from "@/modules/finance/invoice.model";
import { Payout } from "@/modules/finance/payout.model";
import { AppError } from "@/utils/AppError";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePayoutInput,
} from "@/modules/finance/finance.validation";

// --- Invoices ---

export async function getInvoicesForUser(ownerId: string) {
  return Invoice.find({ owner: ownerId }).sort({ issuedDate: -1 });
}

export async function createInvoice(
  ownerId: string,
  input: CreateInvoiceInput,
) {
  const { dealId, contractId, ...rest } = input;

  return Invoice.create({
    ...rest,
    owner: ownerId,
    ...(dealId ? { deal: dealId } : {}),
    ...(contractId ? { contract: contractId } : {}),
  });
}

export async function generateInvoiceNumber(ownerId: string): Promise<string> {
  const count = await Invoice.countDocuments({ owner: ownerId });
  const year = new Date().getFullYear();

  return `INV-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function updateInvoice(
  id: string,
  ownerId: string,
  input: UpdateInvoiceInput,
) {
  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }
  return invoice;
}

export async function deleteInvoice(id: string, ownerId: string) {
  const invoice = await Invoice.findOneAndDelete({ _id: id, owner: ownerId });
  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }
  return invoice;
}

// --- Payouts ---

export async function getPayoutsForUser(ownerId: string) {
  return Payout.find({ owner: ownerId }).sort({ date: -1 });
}

export async function createPayout(ownerId: string, input: CreatePayoutInput) {
  return Payout.create({ ...input, owner: ownerId });
}

// --- Agregacije za dashboard/finance overview ---

export async function getMonthlyRevenue(ownerId: string, months: number = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const result = await Invoice.aggregate([
    {
      $match: {
        owner: new Types.ObjectId(ownerId),
        status: "paid",
        issuedDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$issuedDate" },
          month: { $month: "$issuedDate" },
        },
        amount: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return result.map((r) => ({
    month: MONTH_LABELS[r._id.month - 1],
    amount: r.amount,
  }));
}

export async function createInvoiceFromDeal(deal: {
  _id: Types.ObjectId;
  creator: Types.ObjectId;
  sentBy?: Types.ObjectId;
  brand: string;
  title: string;
  value: number;
  currency: string;
  platform: string;
}) {
  const number = await generateInvoiceNumber(deal.creator.toString());
  const issuedDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return Invoice.create({
    owner: deal.creator,
    billedTo: deal.sentBy,
    deal: deal._id,
    number,
    brand: deal.brand,
    description: deal.title,
    platform: deal.platform,
    amount: deal.value,
    currency: deal.currency,
    status: "sent",
    issuedDate,
    dueDate,
  });
}

export async function getReceivedInvoices(billedToUserId: string) {
  return Invoice.find({ billedTo: billedToUserId }).sort({ issuedDate: -1 });
}
