import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as contractService from "@/modules/contracts/contract.service";
import type {
  CreateContractInput,
  SendContractInput,
  SignContractInput,
  UpdateContractInput,
} from "@/modules/contracts/contract.validation";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export const getContracts = asyncHandler(
  async (req: Request, res: Response) => {
    const contracts = await contractService.getContractsForUser(req.user!.id);
    res.status(200).json({ contracts });
  },
);

export const getSentContracts = asyncHandler(
  async (req: Request, res: Response) => {
    const contracts = await contractService.getContractsSentByUser(
      req.user!.id,
    );
    res.status(200).json({ contracts });
  },
);

export const getContract = asyncHandler(async (req: Request, res: Response) => {
  const contract = await contractService.getContractById(
    getIdParam(req),
    req.user!.id,
  );
  res.status(200).json({ contract });
});

export const createContract = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as CreateContractInput;
    const contract = await contractService.createContract(req.user!.id, input);
    res.status(201).json({ contract });
  },
);

export const sendContract = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as SendContractInput;
    const contract = await contractService.sendContract(req.user!.id, input);
    res.status(201).json({ contract });
  },
);

export const signContract = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as SignContractInput;
    const contract = await contractService.signContract(
      getIdParam(req),
      req.user!.id,
      input,
      {
        ip: req.ip ?? "unknown",
        userAgent: req.headers["user-agent"] ?? "unknown",
      },
    );
    res.status(200).json({ contract });
  },
);

export const updateContract = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as UpdateContractInput;
    const contract = await contractService.updateContract(
      getIdParam(req),
      req.user!.id,
      input,
    );
    res.status(200).json({ contract });
  },
);

export const deleteContract = asyncHandler(
  async (req: Request, res: Response) => {
    await contractService.deleteContract(getIdParam(req), req.user!.id);
    res.status(204).send();
  },
);

export const declineContract = asyncHandler(
  async (req: Request, res: Response) => {
    const contract = await contractService.declineContract(
      getIdParam(req),
      req.user!.id,
    );
    res.status(200).json({ contract });
  },
);

export const requestChanges = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as { message: string };
    const contract = await contractService.requestChanges(
      getIdParam(req),
      req.user!.id,
      input,
    );
    res.status(200).json({ contract });
  },
);

export const reviseContract = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as { bodyText: string };
    const contract = await contractService.reviseContract(
      getIdParam(req),
      req.user!.id,
      input,
    );
    res.status(200).json({ contract });
  },
);

export const withdrawContract = asyncHandler(
  async (req: Request, res: Response) => {
    const contract = await contractService.withdrawContract(
      getIdParam(req),
      req.user!.id,
    );
    res.status(200).json({ contract });
  },
);
