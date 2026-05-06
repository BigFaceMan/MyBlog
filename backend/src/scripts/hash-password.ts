import "../lib/env.js";
import { hashPassword } from "../lib/password.js";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -w backend -- <password>");
  process.exit(1);
}

console.log(await hashPassword(password));
