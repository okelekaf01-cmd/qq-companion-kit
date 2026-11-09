# QQ Companion Kit

把 DSH、QQBridge 和 NapCat 接在一起，让 AI 通过专门的 QQ 小号聊天。提供 Windows x64 双击安装入口、Linux amd64 安装脚本和面向 DIY 的中文图文手册。

**想直接用**，到 [Releases](https://github.com/okelekaf01-cmd/qq-companion-kit/releases) 下载 ZIP，解压后运行安装器。

**想了解原理**，读 [在线图文教程](https://okelekaf01-cmd.github.io/qq-companion-kit/) 或下载后打开 `docs/index.html`。教程涵盖架构、连接地址、角色、权限、备份、升级边界与故障排查，所有示意图均可离线查看。

## 首版范围

v0.1.0 是**联网安装预览版**。需要 Docker，首次构建会下载依赖。Windows 先安装并启动 Docker Desktop 的 WSL 2 / Linux 引擎；Linux 先安装 Docker Engine 与 Compose v2。QQ 扫码、安全验证和 API Key 由本人完成。

- Windows x64 / Linux amd64。
- 安装向导、账号登录入口、模型设置入口、聊天白名单与状态检查。
- QQBridge 二代仿真预设、角色编辑、模型用量查看。
- 独立 Docker 命名卷，随机管理令牌，所有宿主机管理端口绑定 `127.0.0.1`。
- 默认拒绝所有聊天，填好管理 QQ 后才放行。

独立关系摘要、个人相册、自动空间发布、生成图片需要进一步适配。本仓库没有打包任何个人聊天、登录凭据、照片或现成 API Key。NapCat、QQBridge、DSH 的后续插件功能以各自版本与配置为准。

## Windows 本地

1. 按 [Docker 官方文档](https://docs.docker.com/desktop/setup/install/windows-install/) 安装并启动 Docker Desktop，确认使用 Linux 容器。
2. 下载完整 ZIP，解压到独立目录，例如 `D:\Apps\qq-companion-kit`。
3. 双击 `install-windows.cmd`，等待构建。完成后自动打开本机安装向导。
4. 登录 QQ 小号，在 DSH 填 API Key，保存管理 QQ 和可选群号，再用另一个 QQ 发消息测试。

喜欢 Git 的读者可以运行：

```powershell
git clone https://github.com/okelekaf01-cmd/qq-companion-kit.git D:\Apps\qq-companion-kit
cd D:\Apps\qq-companion-kit
.\install-windows.cmd
```

运行时保持电脑、Docker 和网络在线。`stop-windows.cmd` 可以停止服务。

## Linux 服务器

先按 [Docker 官方说明](https://docs.docker.com/engine/install/ubuntu/) 安装 Docker Engine 和 Compose v2，再运行：

```bash
git clone https://github.com/okelekaf01-cmd/qq-companion-kit.git
cd qq-companion-kit
bash install-linux.sh
```

脚本会打印私有配置链接。在自己的电脑运行下面的 SSH 隧道命令，把用户和地址换成自己的服务器，然后打开刚才的配置链接。

```bash
ssh -N -L 127.0.0.1:18670:127.0.0.1:18670 -L 127.0.0.1:18699:127.0.0.1:18699 -L 127.0.0.1:18680:127.0.0.1:18680 -L 127.0.0.1:18610:127.0.0.1:18610 user@your-server
```

配置链接与 `.env` 都包含管理凭据，请私下保管。管理端口已绑定回环地址，用 SSH 隧道访问即可。

## 架构

```mermaid
flowchart LR
  User[你的 QQ] <-->|QQ 网络| NapCat[NapCat / QQ 小号]
  NapCat <-->|OneBot HTTP + 正向 WS| Bridge[QQBridge]
  Bridge <-->|Web API 与受限 MCP| DSH[DeepSeek Harness]
  DSH <-->|API| Model[DeepSeek 模型]
```

安装器用 Compose 运行初始化任务、NapCat 和 Agent 容器。Agent 内 DSH 与桥接分别作为子进程运行。默认 OneBot 连接配置自动写入 `onebot11.json`，账号登录后若未继承默认配置，按图文教程在 NapCat 中核对并启用 HTTP 3000 与正向 WS 3001。

| 组件 | 固定版本 |
| --- | --- |
| DSH | `0.2.1-rc.2` |
| QQBridge | `0.2.1-r1`，提交 `a49877f4e58d04e47532d44b803360d0f001160d` |
| NapCat | `v4.18.41`，镜像 digest 见 Compose |
| Node | Node 24 Bookworm，镜像 digest 见 Dockerfile |
| pnpm | `11.25.0` |

基础安装与依赖下载会耗用磁盘和内存。服务器可先按 2 vCPU / 4 GB 内存规划，Windows 日用电脑建议 16 GB 内存并保留余量。这些是规划建议，具体硬件负载待使用者按实际并发验证。

## 数据与升级

首次启动把桥接放入 `agent_data` 卷，以保存用户 DIY 修改。**重建镜像不会自动替换已有卷内的桥接代码**。本版没有自动迁移器，升级应先备份四个数据卷和 `.env`，在副本核对兼容性。

正常暂停用 `docker compose stop`，恢复用 `docker compose start`。`docker compose down -v` 会删除数据卷，应理解后果并做好备份。

同一 Compose 项目名与宿主机端口会指向同一实例。第二账号需要独立项目名、端口和数据，不能只复制目录后直接运行。

## 验证状态

- 首版 [GitHub 构建与无登录启动验收](https://github.com/okelekaf01-cmd/qq-companion-kit/actions/runs/42623491269) 已通过，使用全新 Linux 数据卷验证 DSH 就绪、管理接口鉴权和默认拒绝聊天。7 项自动测试通过，Windows 脚本语法及教程桌面/手机布局已核对。
- `npm test` 覆盖配置默认拒绝、白名单校验、初始化重试保留数据和安装向导鉴权。
- GitHub Actions 会检查脚本、Compose，构建镜像并验证无需 QQ 登录的初次启动。
- Windows Docker Desktop 全新系统安装、真实 QQ 扫码、手机验证、实际消息收发属于人工验收项。CI 通过也不代表这些步骤已经验证。
- 页面图表是原理与字段示意，真实软件界面以实际版本为准。

下载包的 SHA-256 见同一 Release 中的 `SHA256SUMS.txt`。Windows 可用 `Get-FileHash .\qq-companion-kit-v0.1.0.zip -Algorithm SHA256` 核对，Linux 可在同一目录运行 `sha256sum -c SHA256SUMS.txt`。

## 账号、费用与权限

第三方 QQ 接入可能遇到安全验证、登录限制或账号处理，请用专门小号。API 调用会计费，主动唤醒和搜索也可能带来额外消耗。先在单个管理 QQ 私聊中完成验证，再扩大使用范围。

聊天使用受限 QQ 预设。启用 `closed-agent`、添加 MCP、挂载宿主机目录或安装插件会改变权限。容器、非 root 和只读根目录各有边界，请结合实际挂载与工具检查。

## 开源关系

本项目提供安装编排和教程。QQ 接入、桥接与 Agent 能力来自以下上游，感谢维护者：

- [NapCatQQ](https://github.com/NapNeko/NapCatQQ) / [NapCat-Docker](https://github.com/NapNeko/NapCat-Docker)
- [QQBridge](https://github.com/Derpyu520/qq-bridge)
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)

安装器自身使用 MIT 许可。第三方软件由使用者安装时从上游获取，按各自许可与服务条款使用。详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
