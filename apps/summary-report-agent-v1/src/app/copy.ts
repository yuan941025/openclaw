export const copy = {
  title: "ActionBrief",
  subtitle: "把混亂內容整理成可執行的行動摘要",
  description:
    "ActionBrief 專為接案者、小團隊與高頻整理資訊的工作者設計，將會議記錄、AI 回覆與客戶往來整理成固定五段的行動摘要，協助你更快同步、判斷與推進下一步。",
  localMode: "Public Preview",
  testMode: "No Setup",
  engine: "Structured Output",
  hero: {
    eyebrow: "AI Clarity Workspace",
    title: "把散亂內容整理成下一步清楚、可立即分享的 Action Brief",
    body:
      "無論你貼入的是會議記錄、AI 長回覆、專案進度或客戶對話，ActionBrief 都能快速收斂重點、目前焦點、風險與下一步，幫你少花時間重寫，也更快做出判斷。",
    previewTitle: "從內容輸入到清楚結論",
    previewItems: [
      "快速整理會議、AI 回覆與客戶對話",
      "明確看見重點、風險與下一步",
      "可直接拿去同步、交辦與內部決策",
    ],
  },
  cta: {
    eyebrow: "Start With One Input",
    title: "貼上一段內容，立即體驗 ActionBrief 如何把混亂資訊整理成清楚結論",
    body: "不需要登入、不需要額外設定。現在就能直接體驗，感受更精簡、更可執行的摘要結果。",
    primary: "立即體驗",
    secondary: "查看案例",
    tertiary: "加入候補",
  },
  audience: {
    eyebrow: "Who It’s For",
    title: "為需要快速整理資訊的人打造",
    description: "從個人工作者到小團隊，只要經常面對長內容、碎資訊與需要快速回應的工作場景，都能從 ActionBrief 受益。",
    items: [
      {
        title: "接案者",
        body: "快速整理客戶訊息、會議結論與交付進度，讓回覆更快、下一步更清楚。",
      },
      {
        title: "小團隊 / 工作室",
        body: "把散落在文件、會議與對話中的資訊收斂成一致格式，降低同步成本。",
      },
      {
        title: "AI 高頻使用者",
        body: "把長篇 AI 回覆濃縮成可判讀、可分享、可採取行動的摘要結果。",
      },
    ],
  },
  highlights: {
    eyebrow: "Why ActionBrief",
    title: "讓整理工作更快，也讓決策更快",
    description: "不是再多做一頁筆記，而是把原本混亂的內容，轉成下一步更清楚的工作輸出。",
    items: [
      {
        title: "減少重寫時間",
        body: "不必手動重組內容與重寫格式，直接得到固定結構的摘要結果。",
      },
      {
        title: "降低整理負擔",
        body: "將會議、AI 回覆與客戶往來收斂成同一套閱讀節奏，減少切換成本。",
      },
      {
        title: "更快推進下一步",
        body: "除了整理內容，也會清楚標示目前焦點、風險與是否需要你介入處理。",
      },
    ],
  },
  workflow: {
    eyebrow: "How It Works",
    title: "三步完成一份可分享的 Action Brief",
    description: "從貼入內容到取得結構化摘要，流程保持簡單，讓第一次體驗也能立刻上手。",
    steps: [
      {
        title: "貼上內容",
        body: "將會議記錄、AI 回覆、專案進度或客戶訊息直接貼入體驗區。",
      },
      {
        title: "一鍵整理",
        body: "系統會整理出固定五段結構，讓重點、風險與下一步更容易理解。",
      },
      {
        title: "立即分享或採取行動",
        body: "可直接用於內部同步、客戶整理或任務交辦，快速接上下一步。",
      },
    ],
  },
  pricing: {
    eyebrow: "Plans",
    title: "從 Free 開始，隨工作需求升級到 Pro",
    description: "用更清楚的方案邏輯對應不同使用階段：先免費試用，再依照實際工作需求升級到主收費方案。",
    plans: [
      {
        name: "Free",
        price: "NT$0",
        badge: "適合第一次使用者",
        description: "適合先試用 ActionBrief、快速感受產品價值。核心能力可用，但保留使用量與進階體驗限制。",
        features: ["免費開始體驗", "基本摘要能力可用", "適合低頻與初次使用"],
      },
      {
        name: "Pro",
        price: "NT$399 / 月",
        badge: "主力方案",
        description: "適合真正放進工作流的人使用。更完整、更穩定、可承接高頻需求，也是目前主要收費方案。",
        features: ["更高使用量", "更完整的輸出與情境支援", "無廣告展示體驗"],
        featured: true,
      },
      {
        name: "Team",
        price: "Coming Soon",
        badge: "未來團隊方案",
        description: "保留給團隊協作與更大使用量的未來版本，目前先不作為主要銷售焦點。",
        features: ["團隊協作情境", "更多角色與更大用量", "後續再開放"],
      },
    ],
  },
  panels: {
    input: {
      eyebrow: "Interactive Demo",
      title: "貼上內容",
      description: "貼入會議記錄、AI 回覆、專案進度或客戶訊息，立即體驗 ActionBrief 的整理能力。",
      placeholder: "貼上會議記錄、AI 回覆、專案進度或客戶訊息",
      generate: "建立摘要",
      loadExample: "試用示例",
      helper: "目前以本地規則式整理提供展示體驗，之後可延伸接入模型能力。",
      tags: ["Meeting Notes", "AI Responses", "Client Threads"],
    },
    output: {
      eyebrow: "Structured Preview",
      title: "Action Brief",
      description: "固定五段結構輸出，方便同步、交辦與判斷下一步。",
      frameTitle: "Latest Brief",
      frameBody: "每次輸出都維持一致的閱讀結構，讓內容更容易理解，也更適合直接分享。",
      emptyTitle: "尚未建立摘要",
      emptyBody: "貼入內容後按下「建立摘要」，右側就會生成完整的五段結果。",
      generatedAt: "建立時間",
      sourceMode: "版本狀態",
    },
    examples: {
      eyebrow: "Use Cases",
      title: "三種最常見的使用場景",
      description: "用真實工作情境展示產品價值，讓使用者快速理解 ActionBrief 的實際用途。",
    },
  },
  feedback: {
    eyebrow: "Quick Feedback",
    title: "這次結果有幫助嗎？",
    description: "你的回饋會幫助我們判斷 ActionBrief 是否真的解決了整理工作的痛點。",
    positive: "有幫助",
    negative: "沒幫助",
    thanksPositive: "感謝回饋，已記錄這次結果對你有幫助。",
    thanksNegative: "感謝回饋，已記錄這次結果仍有改善空間。",
  },
  founder: {
    eyebrow: "Founder 預覽",
    title: "最小試用訊號",
    description: "目前先以本地累積資料觀察產品是否真的被試用、使用與回饋。",
    toggleOpen: "查看統計",
    toggleClose: "收起統計",
    metrics: {
      pageViews: "頁面瀏覽",
      generateClicks: "建立摘要點擊",
      successfulOutputs: "成功產生結果",
      exampleClicks: "試用示例點擊",
      feedbackPositive: "有幫助",
      feedbackNegative: "沒幫助",
    },
    scenariosTitle: "案例入口使用",
  },
  signal: {
    eyebrow: "Early Access",
    badge: "Future Product Signals",
    titleEn: "We’re building more AI products beyond ActionBrief.",
    titleZh: "除了 ActionBrief，我們接下來也會推出更多 AI 產品。",
    descriptionEn:
      "Tell us what you want us to build next, what role you play, or where your workflow still needs support. Your input helps us evaluate what to launch next.",
    descriptionZh:
      "也歡迎你告訴我們，希望下一個看到什麼產品、角色或工作流支援。你的意見會成為我們後續評估與開發的重要參考。",
    emailLabelEn: "Email",
    emailLabelZh: "電子郵件",
    emailPlaceholder: "you@company.com",
    noteLabelEn: "What should we build next?",
    noteLabelZh: "你希望我們下一步開發什麼？",
    notePlaceholder: "Share your workflow, role, or product idea / 分享你的工作流程、角色或想看到的產品",
    submit: "加入候補",
    success: "已收到你的訊號",
    successHint: "This preview stores your submission locally for demo purposes. 這個版本會先將提交內容保存在本機預覽資料中。",
    helperEn: "A lightweight signal capture for early access and future product feedback.",
    helperZh: "這是公開前的最小留訊號入口，用來承接早期體驗與未來產品意見。",
  },
  copyAction: {
    label: "複製結果",
    success: "已複製",
    fallback: "複製成功",
  },
  footer: {
    title: "ActionBrief",
    description: "將會議、AI 回覆與客戶往來整理成可執行的行動摘要，讓同步、判斷與下一步推進更有效率。",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    copyright: "© 2026 ActionBrief. All rights reserved.",
  },
  legal: {
    backHome: "返回首頁",
    privacy: {
      eyebrow: "Privacy",
      title: "Privacy",
      intro: "這是 ActionBrief 公開上線前的最小隱私說明頁，用於說明目前展示版本如何處理本地互動資料。",
      sections: [
        {
          title: "本地資料",
          body: "目前體驗資料、Founder Preview 統計與 Early Access 留下的聯絡方式，僅儲存在你的瀏覽器本地端，這一版不會自動上傳到遠端伺服器。",
        },
        {
          title: "資料用途",
          body: "目前收集這些最小資料，是為了展示未來產品上線後可以如何觀察試用訊號與使用意願，不用於第三方廣告追蹤。",
        },
        {
          title: "後續調整",
          body: "若未來接入正式雲端收集或 waitlist 系統，這頁內容會再補上更完整的資料處理與刪除說明。",
        },
      ],
    },
    terms: {
      eyebrow: "Terms",
      title: "Terms",
      intro: "這是 ActionBrief 展示版本的最小使用條款頁，目的在於補齊公開產品頁的基本資訊。",
      sections: [
        {
          title: "展示版本",
          body: "目前版本以產品展示與功能體驗為主，部分資訊與方案說明屬於公開前占位內容，正式商業方案與服務內容日後可能調整。",
        },
        {
          title: "使用責任",
          body: "你可以將內容貼入體驗區測試整理效果，但仍應自行確認結果是否符合實際工作與對外溝通需求。",
        },
        {
          title: "服務更新",
          body: "ActionBrief 後續可能根據試用回饋、功能方向與正式上線規劃調整內容、文案或方案資訊。",
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Contact",
      intro: "如果你想取得更新、合作資訊或後續版本通知，可以先透過這個最小聯絡入口留下資料。",
    },
  },
  sections: {
    completed: "已整理重點",
    current: "目前焦點",
    blockers: "風險與阻礙",
    next: "建議下一步",
    needsAction: "是否需要你介入",
  },
} as const;
