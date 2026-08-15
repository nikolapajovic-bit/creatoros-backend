import { AppError } from "@/utils/AppError";

/*
    Posebna greska za slucaj kad korisnik udari u limit besplatnog plana -
    frontend je prepoznaje po statusu 402 (Payment Required) i prikazuje paywall
    umesto genericke error poruke
*/

export class PaywallError extends AppError {
  constructor(message: string) {
    super(message, 402);
  }
}
