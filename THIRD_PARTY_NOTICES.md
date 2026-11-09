# Third-party software

This repository contains original installation orchestration, a setup UI and documentation. The installation process downloads third-party software from its upstream distribution channels. It does not redistribute a logged-in QQ profile, personal chat data, API credentials or a QQ client binary in its release ZIP.

| Project | Role | Upstream |
| --- | --- | --- |
| QQBridge | OneBot-to-DSH bridge, presets, QQ tools and console | https://github.com/Derpyu520/qq-bridge |
| DeepSeek Harness | Agent runtime and model configuration | https://github.com/deepseek-ai/deepseek-harness |
| NapCatQQ / NapCat-Docker | QQNT integration and OneBot server | https://github.com/NapNeko/NapCatQQ / https://github.com/NapNeko/NapCat-Docker |
| Node.js | JavaScript runtime | https://nodejs.org/ |
| pnpm | Package installation | https://pnpm.io/ |
| Docker / Docker Desktop | Container runtime | https://www.docker.com/ |

QQBridge is downloaded at a fixed upstream commit. Its MIT notice credits `Copyright (c) 2026 Derpyu520 and qq-bridge / QSH contributors`; the downloaded source retains its LICENSE. Other downloaded components and their dependencies retain their own license notices. Docker Desktop has separate licensing terms. QQ is Tencent software and requires compliance with its applicable terms. The installer is a community project.

The MIT license in this repository covers the installer and tutorial authored here, not a replacement license for third-party components.
