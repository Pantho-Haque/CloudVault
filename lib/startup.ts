import { resetAdminPassword, writeCredentialsFile, getLanUrl } from "./auth";
import { logAudit } from "./db";
import { config } from "./config";

let lastPassword = "";

export async function runStartup(): Promise<void> {
  try {
    const { username, password } = await resetAdminPassword();
    lastPassword = password;
    const lanUrl = getLanUrl(config.port);
    const credentialsPath = await writeCredentialsFile(username, password, lanUrl);

    console.log("");
    console.log("╔══════════════════════════════════════════════════════╗");
    console.log("║            CloudVault — Server Started               ║");
    console.log("╠══════════════════════════════════════════════════════╣");
    console.log(`║  Username : ${username.padEnd(40)}║`);
    console.log(`║  Password : ${password.padEnd(40)}║`);
    console.log("╠══════════════════════════════════════════════════════╣");
    console.log(`║  Local    : http://localhost:${config.port}`.padEnd(55) + "║");
    console.log(`║  Network  : ${lanUrl}`.padEnd(55) + "║");
    console.log("╠══════════════════════════════════════════════════════╣");
    console.log(`║  Credentials saved to: ${credentialsPath}`.padEnd(55) + "║");
    console.log("║  Delete this file after noting the credentials.      ║");
    console.log("║  Use these credentials if you forget your password.  ║");
    console.log("╚══════════════════════════════════════════════════════╝");
    console.log("");

    await logAudit(null, username, "server_start", undefined, "Admin credentials regenerated");
  } catch (error) {
    console.error("Startup initialization failed:", error);
  }
}

export function getLastPassword(): string {
  return lastPassword;
}
