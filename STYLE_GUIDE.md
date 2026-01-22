# 样式指南 (Style Guide)

本文档记录了项目的标准配色方案、背景色使用规范及 CSS 变量定义，旨在确保全站视觉一致性并符合 WCAG 2.1 AA 可访问性标准。

## 1. 核心配色系统 (Core Color System)

项目基于 Element Plus 设计规范，扩展了语义化变量。

### 1.1 文本颜色 (Text Colors)
| 变量名 | 色值 | 用途 |
| :--- | :--- | :--- |
| `--text-color-primary` | `#1D2129` | 主要文字，标题 (h1-h3) |
| `--text-color-regular` | `#4E5969` | 常规文字，正文 |
| `--text-color-secondary` | `#86909C` | 次要文字，辅助说明 |
| `--text-color-placeholder` | `#C9CDD4` | 占位符，禁用状态 |

### 1.2 状态颜色 (Status Colors)
| 状态 | 背景色变量 (`--color-*-bg`) | 文本色变量 (`--color-*-text`) |
| :--- | :--- | :--- |
| **Success** | `#E8FFEA` | `#00B42A` |
| **Warning** | `#FFF7E8` | `#FF7D00` |
| **Danger** | `#FFECE8` | `#F53F3F` |

## 2. 背景色规范 (Background Colors)

### 2.1 全局背景
- **页面背景**: `var(--bg-color-page)` (`#F2F3F5`) - 用于页面最底层。
- **卡片背景**: `var(--bg-color-card)` (`#FFFFFF`) - 用于内容容器、卡片。
- **弹窗/遮罩**: `var(--bg-color-overlay)` (`#FFFFFF`) - 用于模态框。

### 2.2 区域背景
- **功能区块**: `var(--bg-color-section)` (`#F7F8FA`) - 用于筛选栏、次级容器。
- **表头/浅色区**: `var(--bg-color-section-light)` (`#F9FAFB`) - 用于表格头部。

## 3. 使用规范 (Usage Guidelines)

### 3.1 CSS 变量使用
请在所有样式中优先使用 CSS 变量，而不是硬编码 Hex 色值。

```css
/* 推荐 */
.card {
  background-color: var(--bg-color-card);
  color: var(--text-color-primary);
}

/* 避免 */
.card {
  background-color: #FFFFFF;
  color: #1D2129;
}
```

### 3.2 可访问性 (Accessibility)
- 确保文本与背景的对比度至少为 **4.5:1** (AA级)。
- 使用 `--text-color-primary` 或 `--text-color-regular` 在 `--bg-color-card` 或 `--bg-color-page` 上是安全的。
- 避免在深色背景上使用 `--text-color-secondary`。

### 3.3 响应式与主题
- 目前所有变量定义在 `:root` 下。
- 未来支持暗黑模式时，只需重新定义 `:root[theme='dark']` 下的变量值即可，无需修改业务组件代码。
