import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import * as dealService from "@/modules/deals/deal.service";
import type {
  CreateDealInput,
  SendDealInput,
  UpdateDealInput,
} from "@/modules/deals/deal.validation";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export const getDeals = asyncHandler(async (req: Request, res: Response) => {
  const deals = await dealService.getDealsForUser(req.user!.id);
  res.status(200).json({ deals });
});

export const getSentDeals = asyncHandler(
  async (req: Request, res: Response) => {
    const deals = await dealService.getDealsSentByUser(req.user!.id);
    res.status(200).json({ deals });
  },
);

export const getDeal = asyncHandler(async (req: Request, res: Response) => {
  const deal = await dealService.getDealById(getIdParam(req), req.user!.id);
  res.status(200).json({ deal });
});

export const createDeal = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateDealInput;
  const deal = await dealService.createDeal(req.user!.id, input);
  res.status(201).json({ deal });
});

export const sendDeal = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as SendDealInput;
  const deal = await dealService.sendDeal(req.user!.id, input);
  res.status(201).json({ deal });
});

export const respondToDeal = asyncHandler(
  async (req: Request, res: Response) => {
    const { response } = req.body as { response: "accepted" | "declined" };
    if (response !== "accepted" && response !== "declined") {
      throw new AppError("Response must be 'accepted' or 'declined'", 400);
    }
    const deal = await dealService.respondToDeal(
      getIdParam(req),
      req.user!.id,
      response,
    );
    res.status(200).json({ deal });
  },
);

export const updateDeal = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateDealInput;
  const deal = await dealService.updateDeal(
    getIdParam(req),
    req.user!.id,
    input,
  );
  res.status(200).json({ deal });
});

export const deleteDeal = asyncHandler(async (req: Request, res: Response) => {
  await dealService.deleteDeal(getIdParam(req), req.user!.id);
  res.status(204).send();
});

export const proposeOffer = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as { value: number; message?: string };
    const deal = await dealService.proposeOffer(
      getIdParam(req),
      req.user!.id,
      input,
    );
    res.status(200).json({ deal });
  },
);

export const acceptOffer = asyncHandler(async (req: Request, res: Response) => {
  const deal = await dealService.acceptOffer(getIdParam(req), req.user!.id);
  res.status(200).json({ deal });
});

export const markComplete = asyncHandler(
  async (req: Request, res: Response) => {
    const deal = await dealService.markDealComplete(
      getIdParam(req),
      req.user!.id,
    );

    res.status(200).json({ deal });
  },
);
