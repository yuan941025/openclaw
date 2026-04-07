# Lobster UI v1

Lobster UI v1 是一個獨立的 Vite + React + TypeScript 控制台，透過現有的 OpenClaw HTTP bridge 操作 VS Code 與工作區。

## 啟動方式

1. 在 repo root 啟動 bridge：

```bash
npm run vscode-bridge
```

2. 另開一個 terminal 啟動 UI：

```bash
cd apps/lobster-ui-v1
npm install
npm run dev
```

桌面端預設網址：`http://127.0.0.1:4174`

如果 `4174` 已被占用，Vite 會自動改用下一個可用埠；請以 terminal 顯示的實際網址為準。

## 手機開啟方式

1. 手機與電腦接在同一個 Wi‑Fi。
2. 在電腦上查詢目前的區網 IP：

```powershell
ipconfig
```

找到目前使用網卡的 `IPv4 Address`，例如 `192.168.1.112`。

3. 手機打開：

```text
http://192.168.1.112:4174
```

如果 dev server 因為埠被占用改到了其他埠，請把上面的 `4174` 換成實際顯示的埠號。

UI 會透過 Vite proxy 轉發到同一台電腦上的 loopback bridge，所以手機不用直接連 `127.0.0.1:8787`。

## Preview / Build

```bash
cd apps/lobster-ui-v1
npm run build
npm run preview
```

Preview 預設網址：`http://127.0.0.1:4175`

如果 `4175` 已被占用，Vite 也會自動改用下一個可用埠；若要從手機開 preview，請改用：

```text
http://<電腦區網IP>:4175
```

並依照 terminal 實際顯示的埠號調整。

## Bridge URL 設定

UI 透過 `VITE_BRIDGE_BASE_URL` 指向 bridge。

1. 把 `.env.example` 複製成 `.env`
2. 依照你的拓撲調整 `VITE_BRIDGE_BASE_URL`
3. 重新啟動 `npm run dev` 或 `npm run preview`

同機啟動 bridge + UI：

```bash
VITE_BRIDGE_BASE_URL=http://127.0.0.1:8787
```

如果 UI 與 bridge 不在同一台機器，再改成 bridge 所在電腦的區網 IP：

```bash
VITE_BRIDGE_BASE_URL=http://192.168.1.23:8787
```

## 目前能力

- 桌面端與手機端共用同一套 bridge service 與 mock fallback
- bridge 有回應時會顯示真實狀態、動作紀錄與執行結果
- bridge 暫時不可用時，自動回到模擬模式
- 手機端可直接輸入指令或點快捷按鈕操作 bridge