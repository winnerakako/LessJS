import { Response } from "express";
import { LessConfig } from "../../less-config";

// Response Handler
interface ResponseData {
  message?: string;
  [key: string]: any;
}

interface ModifiedResponseData {
  statusCode: number;
  status: "success" | "failed";
  message?: string;
  data: Omit<ResponseData, "message">;
  meta: {
    timestamp: Date;
    version: string | undefined;
  };
}

export const LessResponse = (
  res: Response,
  statusCode: number,
  data: ResponseData
): any => {
  console.log("RESPONSE HANDLER:", statusCode, data?.message);

  const currentTime = new Date();
  const { message, ...newData } = data;

  const status = statusCode >= 200 && statusCode < 400 ? "success" : "failed";

  const modifiedData: ModifiedResponseData = {
    statusCode,
    status,
    message,
    data: newData,
    meta: {
      timestamp: currentTime,
      version: LessConfig.appVersion,
    },
  };

  return res.status(statusCode).json(modifiedData);
};
