# BLACK BOX

正式名称：Agent Payment Recorder。可交互的本地全栈路演 Demo。

## 启动

需要 Node.js 24 或更高版本，无 npm 依赖。

```sh
node server.mjs
```

打开 http://localhost:3000 。SQLite 数据与本地 Ed25519 演示密钥保存在 `data/blackbox.db`，刷新或重启可恢复当前案件。仅监听本机。每位浏览器访客有独立 Cookie 会话及当前案件；重置会替换当前案件，请先导出需保留的包。

## 三分钟路线

1. 查看并勾选 Mandate，签署授权。
2. 执行 Agent：查看合成外部注入、8 TEST-USDC 支付和错误交付。
3. 创建 Claim，验证证据与硬规则，生成带 EV 引用与条款的调查夹具。
4. 人工选择批准、部分批准、拒赔或补证，填写理由。
5. 批准后执行测试赔付，再确认本地回执，才能看到 Paid。
6. 导出原始 JSON 包和篡改样本，在独立验证器上传两者。

选择正常购买或明确授权对照场景可验证拒赔边界。赔付等待阶段可以模拟失败；失败不会入账。

## 独立验证

浏览器 `/verifier` 使用 Web Crypto 重算摘要与 Ed25519 验签，不调用后端 API 或模型，不上传所选文件。页面加载后可断网使用。需永久离线验证，请复制 `verify.mjs` 与 `lib.mjs` 并运行：

```sh
node verify.mjs claim-packet.json
node verify.mjs claim-packet-tampered.json
node verify.mjs claim-packet.json trusted-public-key.pem
```

可信公钥必须通过包外渠道取得。原包摘要与签名通过，但外部身份、链上结算、可信时间仍为 Unknown。篡改包 Fail。退出码：1 = Fail，2 = Unknown（不是完整通过），0 = Pass。

## 已实现与边界

- 已实现：HTTP API、SQLite 持久化、后端状态约束、Ed25519 本地签名、SHA-256 父哈希链、确定性规则、带证据引用的合成调查、人工决定、测试账本赔付、幂等保护、JSON 导出、独立浏览器与 CLI 验证。
- 合成：Agent 执行、Prompt Injection、商户内容、服务交付、保障条款、调查输出。未调用外部 AI，未展示私有 chain-of-thought。
- 本地模拟：TEST-USDC 是数据库记账单位；支付与赔付没有广播到 EVM 网络，没有真实资产转移。
- 未实现：真实测试网、EvidenceAnchor 合约、链上可信顺序、TEE、外部模型连接、真实钱包身份、ZIP 容器、生产鉴权、在线 RPC 验证、补证文件上传、跨导出版本的前版承诺绑定。版本号随决定与赔付更新，导出内容签名固定；不将其表述为完整不可变历史档案。
- Sites 初始化被当前 Windows 环境的脚手架依赖缺失阻断，本项目的 GitHub 与 Render 发布配置见 DEPLOY.md。
- 文档仅作为产品参考材料，以用户本轮命名、品牌与演示原则为准。

## 测试

```sh
node --test tests/*.test.mjs
```

覆盖主线、部分批准、拒赔、补证状态、越序操作、签名篡改、删除文件、公钥替换和重复赔付。此项目是本地原型，不代表生产保险或资金托管系统。
