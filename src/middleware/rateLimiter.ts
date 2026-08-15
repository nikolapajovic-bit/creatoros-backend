import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 10, // maksimalno 10 pokušaja po IP adresi u tom prozoru
  message: {
    status: "error",
    message: "Too many attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 15, // 15 AI poziva po minutu po IP adresi
  message: {
    status: "error",
    message: "Too many AI requests, please slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
