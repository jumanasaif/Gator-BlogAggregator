import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string; 
};


function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const raw = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };
  fs.writeFileSync(getConfigFilePath(), JSON.stringify(raw, null, 2), "utf-8");
}

function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    throw new Error("Invalid config format");
  }
  if (typeof rawConfig.db_url !== "string") {
    throw new Error("db_url must be a string");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}

export function readConfig(): Config {
  const filePath = getConfigFilePath();
  const rawStr = fs.readFileSync(filePath, "utf-8");
  const raw = JSON.parse(rawStr);
  return validateConfig(raw);
}

export function setUser(userName: string): void {
  const cfg = readConfig();
  cfg.currentUserName = userName;
  writeConfig(cfg);
}