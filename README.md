# DTC Shopify 主题项目

## 项目概述
这是一个基于 Shopify Liquid 的电商主题项目，专为 DTC (Direct to Consumer) 品牌设计。

## 主要功能

### 1. USMAMA 隐藏页面 (/pages/usmama)
- **功能描述**: 专门展示 USMAMA 品牌产品的隐藏页面
- **访问控制**: 通过 URL 查询参数 `key` 进行访问控制
- **产品展示**: 显示两个指定产品："Milkflow Drinkmix" 和 "Milkflow Soft Chew"
- **样式一致性**: 复用集合页面的产品卡片样式和布局
- **SEO 设置**: 防止搜索引擎索引，保持页面隐私

### 使用方法
1. **访问页面**: `https://你的域名/pages/usmama?key=xyz`
2. **密钥**: 当前密钥为 `xyz`（可在模板中修改）
3. **无密钥访问**: 自动重定向到 404 页面

### 技术实现
- **模板文件**: `templates/page.usmama.liquid`
- **产品获取**: 通过产品 handle 直接引用
- **组件复用**: 使用 `card-product` snippet
- **样式引用**: 复用集合页面 CSS
- **脚本功能**: 快速加购、购物车更新等

### 安全特性
- 前端密钥校验
- noindex meta 标签
- 不出现在站点导航中
- 可配置访问密钥

## 项目结构
```
DTC/
├── assets/           # CSS 和 JS 资源文件
├── blocks/           # 可重用的内容块
├── config/           # 主题配置文件
├── layout/           # 页面布局模板
├── locales/          # 多语言翻译文件
├── sections/         # 页面区块模板
├── snippets/         # 可重用代码片段
└── templates/        # 页面模板文件
    └── page.usmama.liquid  # USMAMA 隐藏页面模板
```

## 开发说明

### 修改访问密钥
在 `templates/page.usmama.liquid` 文件中找到以下代码并修改：
```javascript
const secretKey = 'xyz';  // 修改为新的密钥
```

### 修改展示产品
在模板中修改产品 handle：
```liquid
{% assign product1 = all_products['milkflow-drinkmix-handle'] %}
{% assign product2 = all_products['milkflow-soft-chew-handle'] %}
```

### 样式自定义
页面使用以下 CSS 文件：
- `template-collection.css` - 集合页面样式
- `component-card.css` - 产品卡片样式
- `component-price.css` - 价格样式
- `quick-add.css` - 快速加购样式

### 脚本依赖
- `quick-add.js` - 快速加购功能
- `product-form.js` - 产品表单处理

## 版本信息
- Shopify Liquid 主题
- 使用 Online Store 2.0 架构
- 兼容移动端响应式设计

## 部署说明
1. 将代码上传到 Shopify 主题
2. 在 Shopify 后台创建页面（URL handle: usmama）
3. 选择 page.usmama 模板
4. 页面保持发布状态但不添加到导航

## 维护注意事项
- 定期检查产品 handle 是否正确
- 监控页面访问日志
- 根据需要更新访问密钥
- 确保相关 CSS 和 JS 文件完整
