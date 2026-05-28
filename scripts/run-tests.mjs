/**
 * 与 Browser Test Agent 服务端 runner 对齐：按序执行各 test 回调体，并注入 testEnv。
 * 生成用例使用 testEnv.TEST_USERNAME 等，而非 Playwright 内置 fixture。
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';

function buildTestEnv() {
  const keys = new Set(['TEST_USERNAME', 'TEST_PASSWORD']);
  for (const k of String(process.env.RUN_TEST_ENV_KEYS ?? '').split(/[,;\s]+/)) {
    if (k.trim()) keys.add(k.trim());
  }
  const out = {};
  for (const key of keys) {
    const v = process.env[key];
    if (typeof v === 'string' && v.length > 0) out[key] = v;
  }
  return out;
}

function hasTestCredentials(testEnv) {
  return Boolean(testEnv.TEST_USERNAME && testEnv.TEST_PASSWORD);
}

/** 含 testEnv 凭据或明显为登录流程的 spec，在无 Secrets 时跳过以免 CI 误报 */
function shouldSkipSpecWithoutCredentials(content, testEnv) {
  if (hasTestCredentials(testEnv)) return false;
  if (/\btestEnv\.(TEST_USERNAME|TEST_PASSWORD)\b/.test(content)) return true;
  return /moonx-login|login-modal|登录弹|登入弹|test\([^)]*登录/i.test(content);
}

function extractAllTestCallbackBodies(source) {
  const bodies = [];
  let pos = 0;
  while (pos < source.length) {
    const slice = source.slice(pos);
    const head = /\btest\s*(?:\.only\s*)?\(/.exec(slice);
    if (!head) break;
    const absHead = pos + head.index;
    const arrow = source.indexOf('=>', absHead);
    if (arrow === -1) {
      pos = absHead + 1;
      continue;
    }
    const bodyOpen = source.indexOf('{', arrow);
    if (bodyOpen === -1 || bodyOpen < arrow) {
      pos = absHead + 1;
      continue;
    }
    let depth = 0;
    let i = bodyOpen;
    for (; i < source.length; i++) {
      const c = source[i];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          bodies.push(source.slice(bodyOpen + 1, i));
          pos = i + 1;
          break;
        }
      }
    }
    if (i >= source.length) break;
  }
  return bodies;
}

async function readDefaultBaseUrl(cwd) {
  if (process.env.BASE_URL?.trim()) return process.env.BASE_URL.trim();
  try {
    const raw = await readFile(join(cwd, '.browser-test-agent.json'), 'utf8');
    const json = JSON.parse(raw);
    const url = String(json.defaultBaseUrl ?? '').trim();
    if (url) return url;
  } catch {
    /* optional */
  }
  return '';
}

async function runSpecOnPage(page, content, perTestTimeout, testEnv, logs) {
  const bodies = extractAllTestCallbackBodies(content).filter((b) => b.trim());
  if (bodies.length === 0) {
    throw new Error('未能解析 test 体：需要 test(..., async (...) => { ... })');
  }
  const AsyncConstructor = Object.getPrototypeOf(async function () {}).constructor;
  let passed = 0;
  let failed = 0;
  for (let bi = 0; bi < bodies.length; bi++) {
    logs.push(`[runner] 执行第 ${bi + 1}/${bodies.length} 段 test 体`);
    const runner = new AsyncConstructor('page', 'expect', 'testEnv', `"use strict";\n${bodies[bi]}`);
    try {
      await Promise.race([
        runner(page, expect, testEnv),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`第 ${bi + 1} 段测试超过 ${perTestTimeout}ms`)), perTestTimeout),
        ),
      ]);
      passed++;
    } catch (e) {
      failed++;
      logs.push(`[error] 第 ${bi + 1} 段: ${String(e)}`);
    }
  }
  const POST_TEST_DWELL_MS = 6000;
  logs.push(`[runner] 全部用例执行完毕，停留 ${POST_TEST_DWELL_MS / 1000}s`);
  await page.waitForTimeout(POST_TEST_DWELL_MS);
  return { passed, failed };
}

async function main() {
  const cwd = process.cwd();
  const baseUrl = await readDefaultBaseUrl(cwd);
  if (!baseUrl) {
    console.error('缺少 BASE_URL：请设置环境变量，或在仓库 Secrets 中配置 BASE_URL，或由 Agent 上传 .browser-test-agent.json');
    process.exit(1);
  }

  const testsDir = join(cwd, 'tests');
  let entries;
  try {
    entries = (await readdir(testsDir)).filter((f) => f.endsWith('.spec.ts')).sort();
  } catch {
    console.error('未找到 tests/ 目录');
    process.exit(1);
  }
  if (entries.length === 0) {
    console.log('tests/ 下无 *.spec.ts，跳过');
    process.exit(0);
  }

  const testEnv = buildTestEnv();
  if (!hasTestCredentials(testEnv)) {
    console.log('[runner] 未配置 TEST_USERNAME/TEST_PASSWORD：将跳过依赖登录凭据的 spec 文件');
  }
  const totalTimeout = Number(process.env.TEST_TIMEOUT_MS ?? 120_000);
  const perTestTimeout = Math.max(15_000, Math.floor(totalTimeout / 4));
  const headless = process.env.HEADED !== '1' && process.env.HEADED !== 'true';

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  const browser = await chromium.launch({ headless });
  try {
    for (const file of entries) {
      const content = await readFile(join(testsDir, file), 'utf8');
      if (shouldSkipSpecWithoutCredentials(content, testEnv)) {
        console.log(`\n=== ${file} ===`);
        console.log(
          '[skip] 需要 Actions Secrets 或 .env 中的 TEST_USERNAME、TEST_PASSWORD（登录类用例）',
        );
        totalSkipped++;
        continue;
      }
      console.log(`\n=== ${file} ===`);
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on('console', (msg) => console.log(`[console.${msg.type()}] ${msg.text()}`));
      page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`));
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      const logs = [];
      const { passed, failed } = await runSpecOnPage(page, content, perTestTimeout, testEnv, logs);
      for (const line of logs) console.log(line);
      totalPassed += passed;
      totalFailed += failed;
      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n合计：通过 ${totalPassed} · 失败 ${totalFailed} · 跳过 ${totalSkipped}`);
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
