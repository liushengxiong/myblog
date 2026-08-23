/**
 * scripts/hash-password.mjs
 *
 * 用法：
 *   node scripts/hash-password.mjs  "your-password"
 *
 * 输出：与 src/lib/auth.ts 中 verifyPassword 兼容的 scrypt 哈希字符串。
 * 把输出写入 ADMIN_PASSWORD_HASH 环境变量（不要 commit 真实值）。
 */
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
	console.error('用法: node scripts/hash-password.mjs "<你的密码>"');
	process.exit(1);
}
if (password.length < 8) {
	console.error("错误：密码至少 8 位。");
	process.exit(2);
}

const PARAMS = { N: 16384, r: 8, p: 1, dkLen: 32 };
const salt = crypto.randomBytes(16);

crypto.scrypt(password, salt, PARAMS.dkLen, PARAMS, (err, derived) => {
	if (err) throw err;
	const hash = `scrypt$N=16384,r=8,p=1$${salt.toString(
		"base64url",
	)}$${derived.toString("base64url")}`;
	process.stdout.write(`ADMIN_PASSWORD_HASH=${hash}\n`);
	process.stderr.write(
		"\n[OK] 请把上面这行写入 .env / Vercel Environment Variables（不要 commit 真实值）。\n",
	);
});
