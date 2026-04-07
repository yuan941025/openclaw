# ActionBrief

ActionBrief 是一個可公開展示的 AI 產品首頁與本地體驗版，提供固定五段的結構化摘要結果，適合拿來驗證產品定位、首頁轉換與試用行為。

## 本地啟動

```bash
cd apps/summary-report-agent-v1
npm install
npm run dev
```

預設網址：

- `http://127.0.0.1:4284`

## 建置

```bash
npm run build
```

## 目前內容

- 品牌化首頁與公開產品敘事
- Demo 體驗區與固定五段輸出
- 三組案例切換
- Founder Preview 最小試用統計
- 結果區一鍵複製
- Early Access 留訊號入口
- Privacy / Terms / Contact 最小公開頁面

## 上線說明

部署與公開設定請看：

- `DEPLOY.md`

目前版本可直接部署到 Vercel，並以 `apps/summary-report-agent-v1` 作為 Root Directory。
