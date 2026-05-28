# playwright-test-code

[Browser Test Agent](https://github.com/Zian502/playwright-test-code) 自动生成的 Playwright 测试用例仓库。

## 目录

- `tests/` — `.spec.ts` 测试文件（Agent 自动上传）
- `scripts/run-tests.mjs` — 与 Agent 服务端一致的 runner（注入 `testEnv`）
- `.github/workflows/playwright.yml` — GitHub Actions CI/CD

## GitHub Actions

在仓库 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 说明 |
|--------|------|
| `BASE_URL` | 被测页面 URL（也可写在 `.browser-test-agent.json` 的 `defaultBaseUrl`） |
| `TEST_USERNAME` | 登录账号（可选） |
| `TEST_PASSWORD` | 登录密码（可选） |
| `RUN_TEST_ENV_KEYS` | 额外注入键名，逗号分隔（可选） |

**触发方式：**

- 向 `main` 推送 `tests/`、`scripts/` 等变更
- 针对 `main` 的 Pull Request
- **Actions → Playwright Tests → Run workflow**（可选手动填写 `base_url`）

CI 使用 **Node.js 20** + **Chromium**，执行 `npm test`。

## 本地运行

```bash
npm install
npx playwright install chromium
cp .env.example .env   # 编辑 BASE_URL 与凭据
export $(grep -v '^#' .env | xargs) && npm test
```
