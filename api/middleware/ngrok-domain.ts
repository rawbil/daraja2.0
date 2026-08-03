import { NextFunction, Request, Response } from "express";
import ngrok from "@ngrok/ngrok";
import "dotenv/config";
const ngrok_authtoken = process.env.NGROK_AUTHTOKEN as string;
const port = process.env.PORT as string;
const ngrokBinDir = process.env.NGROK_BIN_DIR || "/usr/local/bin";

export async function NgrokDomain(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!ngrok_authtoken || ngrok_authtoken == "") {
      return res
        .status(400)
        .json({ success: false, message: "NGROK Authtoken missing" });
    }
    if (!port || port == "") {
      return res
        .status(400)
        .json({ success: false, message: "NGROK port missing" });
    }

    const domain = await ngrok.connect({
      authtoken: ngrok_authtoken,
      addr: port,
    });
    console.log(domain.url());

    req.domain = domain.url() as string;
    next();
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}
