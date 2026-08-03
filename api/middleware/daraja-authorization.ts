import axios from "axios";
import { NextFunction, Request, Response } from "express";
const username = process.env.DARAJA_CONSUMER_KEY?.trim();
const password = process.env.DARAJA_CONSUMER_SECRET?.trim();

export async function GenerateDarajaAuthorization(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!username || !password) {
      return res.status(500).json({
        success: false,
        error: "Missing DARAJA_CONSUMER_KEY or DARAJA_CONSUMER_SECRET",
      });
    }

    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        // Use built-in Basic Auth
        auth: {
          username,
          password,
        },
      },
    );

    // console.log(response)
    req.dtoken = response.data.access_token;
    return next();
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
