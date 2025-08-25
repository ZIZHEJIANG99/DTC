# Shopify购物车折扣商品推荐栏

## 功能概述

这是一个完整的Shopify购物车页折扣商品推荐栏解决方案，包括前端展示、后端数据接口对接、AJAX加载、加入购物车功能等。

## 功能特性

- ✅ **响应式设计** - 支持桌面和移动设备
- ✅ **AJAX加载** - 异步加载推荐商品，不阻塞页面
- ✅ **无刷新购物车** - 使用Shopify AJAX Cart API
- ✅ **多语言支持** - 支持中英文切换
- ✅ **错误处理** - 完善的加载失败和重试机制
- ✅ **折扣展示** - 高亮显示折扣商品和折扣比例
- ✅ **性能优化** - 图片懒加载和缓存策略

## 文件结构

```
├── sections/
│   └── cart-recommendations.liquid      # 推荐栏Liquid模板
├── assets/
│   ├── component-cart-recommendations.css  # 推荐栏样式
│   └── cart-recommendations.js           # 推荐栏JavaScript逻辑
├── templates/
│   └── cart.json                         # 购物车页面模板
└── locales/
    ├── en.default.json                   # 英文翻译
    └── zh-CN.json                        # 中文翻译
```

## 安装步骤

### 1. 上传文件到Shopify主题

将以下文件上传到你的Shopify主题：

- `sections/cart-recommendations.liquid`
- `assets/component-cart-recommendations.css`
- `assets/cart-recommendations.js`

### 2. 更新购物车模板

推荐栏已自动添加到 `templates/cart.json` 中，位置在购物车商品列表和购物车底部之间。

### 3. 更新语言文件

推荐栏的多语言文本已添加到：
- `locales/en.default.json`
- `locales/zh-CN.json`

## 配置说明

### 在主题编辑器中配置

1. 进入Shopify后台 → 主题 → 自定义
2. 导航到购物车页面
3. 在页面右侧找到"Cart Recommendations"部分
4. 配置以下选项：
   - **Heading**: 推荐栏标题（默认："Recommended for you"）
   - **Subheading**: 推荐栏副标题（默认："You might also like these discounted products"）
   - **API Endpoint URL**: 推荐商品数据接口URL（留空使用本地演示数据）
   - **Maximum Products**: 最大显示商品数量（1-20，默认6）

### 支持购物车抽屉和完整页面

推荐栏功能现在同时支持：
- **购物车抽屉（侧边栏）** - 推荐栏已集成到Ajax购物车抽屉中
- **完整购物车页面** - 原有的完整页面功能保持不变

### 使用本地演示数据

系统已预配置包含Milkflow系列产品的本地数据，包括：
- **Milkflow® Breastfeeding Soft Chews, Berry Flavor, 28 Ct** ⭐
- Milkflow® Chocolate Drink Mix, 14 Servings
- Milkflow® Moringa Gummies, Green Apple, 60 Ct
- Milkflow® Energy Drink Mix, Berry Blast, 14 Servings
- Milkscreen™ Breast Milk Alcohol Test Strips, 10 Ct
- UpSpring Prenatal Vitamin Gummies, Mixed Berry, 90 Ct

如果API Endpoint URL留空，系统将自动使用这些本地演示数据。

### 抽屉中的推荐栏特性

- **自适应布局** - 在抽屉的狭窄空间中优化显示
- **单列布局** - 垂直堆叠商品，便于在移动设备上浏览
- **紧凑设计** - 更小的商品图片和按钮，节省空间
- **自动初始化** - 当购物车抽屉打开时自动加载推荐产品

### 获取真实产品信息

要使用真实的产品数据，你需要：

1. **在Shopify后台查找产品ID**：
   - 进入产品管理页面
   - 找到"Milkflow® Breastfeeding Soft Chews, Berry Flavor, 28 Ct"
   - 复制产品URL中的ID或使用浏览器开发者工具查看

2. **更新演示数据**：
   - 编辑 `assets/recommended-products-data.json`
   - 将演示数据替换为真实的产品信息
   - 确保价格格式为分（cents），如：$24.99 = 2499

3. **配置API端点**（推荐）：
   - 创建后端API返回真实产品数据
   - 在主题编辑器中配置API Endpoint URL

## API接口规范

### 请求格式

```http
GET /your-discounted-products-endpoint
```

### 响应格式

```json
{
  "products": [
    {
      "id": 123456,
      "title": "Product Name",
      "image": "https://example.com/image.jpg",
      "price": 19900,              // 价格（分）
      "compare_at_price": 29900,   // 原价（分）
      "variant_id": 789012,        // 变体ID
      "url": "/products/product-handle"  // 商品页面URL
    }
  ]
}
```

### 数据字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | number | 是 | 商品ID |
| title | string | 是 | 商品标题 |
| image | string | 是 | 商品图片URL |
| price | number | 是 | 当前价格（分） |
| compare_at_price | number | 否 | 原价（分，用于显示折扣） |
| variant_id | number | 是 | 商品变体ID（用于加入购物车） |
| url | string | 否 | 商品页面URL |

## 使用示例

### 创建后端API端点

你可以通过以下方式创建API端点：

1. **Shopify Function** - 使用Shopify Functions创建后端逻辑
2. **App Proxy** - 使用Shopify App创建代理端点
3. **外部服务** - 使用第三方服务提供API（注意CORS设置）

### 示例API实现

```javascript
// 示例：使用Shopify App Proxy
app.get('/discounted-products', async (req, res) => {
  try {
    // 获取折扣商品逻辑
    const products = await getDiscountedProducts();

    res.json({
      products: products.map(product => ({
        id: product.id,
        title: product.title,
        image: product.image.src,
        price: product.price,
        compare_at_price: product.compare_at_price,
        variant_id: product.variants[0].id,
        url: product.url
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});
```

## 自定义样式

### 修改推荐栏外观

在 `component-cart-recommendations.css` 中可以自定义：

```css
/* 更改推荐栏背景色 */
.cart-recommendations {
  background-color: #f0f8ff;
}

/* 自定义商品卡片样式 */
.cart-recommendations__item {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### 调整响应式布局

```css
/* 移动端显示单列 */
@media (max-width: 480px) {
  .cart-recommendations__list {
    grid-template-columns: 1fr;
  }
}
```

## 故障排除

### 推荐栏不显示

1. 检查API端点URL是否正确配置
2. 确认API返回正确的JSON格式
3. 查看浏览器控制台是否有JavaScript错误

### "FAILED to add to cart, please try again" 错误

如果点击"Add to cart"按钮时出现失败错误，请按以下步骤排查：

**常见原因**:
1. **演示数据问题** - 使用了不存在的演示variant_id
2. **产品不存在** - variant_id对应的产品在商店中不存在
3. **库存不足** - 商品缺货或库存为0
4. **API错误** - Shopify Cart API调用失败

**解决步骤** ✅ (已优化):

1. **检查是否为演示数据**
   - 如果看到"This is a demo product"提示，说明当前使用的是演示数据
   - 需要替换为真实的产品数据

2. **获取真实的variant_id**
   ```bash
   # 在Shopify后台查找产品
   # 或在产品页面的控制台运行：
   console.log(window.ShopifyAnalytics?.meta?.product?.variants);
   ```

3. **更新推荐产品数据**
   ```json
   // 编辑 assets/recommended-products-data.json
   {
     "products": [
       {
         "id": 123456,
         "title": "Real Product Name",
         "variant_id": 987654321, // 使用真实的variant_id (数字)
         "price": 2999,
         "url": "/products/real-product-handle"
       }
     ]
   }
   ```

4. **验证修复效果**
   - 打开浏览器开发者工具 (F12)
   - 查看Console标签的调试信息
   - 点击"Add to cart"按钮
   - 确认看到"Successfully added to cart"消息

**调试信息**:
修复后的代码会在控制台显示详细信息：
```
Adding to cart - Variant ID: 987654321
Successfully added to cart: {items: [...]}
```

**错误码说明**:
- **HTTP 422**: 产品variant不存在或缺货
- **HTTP 404**: Cart API端点未找到
- **Invalid variant ID**: variant_id格式错误或为空

### 样式问题

1. 确认CSS文件已正确加载
2. 检查是否有CSS冲突
3. 使用浏览器开发者工具调试

### 抽屉中推荐栏不显示

1. **确认购物车不为空** - 推荐栏只在购物车中有商品时显示
2. **检查抽屉打开事件** - 确保抽屉完全打开后推荐栏才初始化
3. **验证DOM元素** - 检查抽屉中是否存在`drawer-recommendations-*`ID的元素
4. **查看控制台错误** - 检查是否有JavaScript错误阻止初始化
5. **确认资源加载** - 确保CSS和JS文件在抽屉中正确加载

### 抽屉中推荐栏布局问题

1. **检查抽屉宽度** - 确保抽屉有足够宽度显示推荐栏
2. **验证CSS优先级** - 抽屉样式可能覆盖推荐栏样式
3. **测试响应式布局** - 在不同设备上测试抽屉布局

### 购物车变动时推荐栏一直Loading问题 ✅ (已修复)

**问题表现**：改动购物车内容时，推荐栏显示"Loading..."不消失

**修复措施**：
1. **智能容器查找** - 自动识别页面和抽屉中的推荐栏
2. **事件监听优化** - 监听多种购物车更新事件
3. **ID冲突解决** - 使用drawer-前缀避免页面和抽屉ID冲突

**调试步骤**：
```javascript
// 在控制台查看推荐栏初始化过程
// 应该看到这些日志：
CartRecommendations: Initializing...
CartRecommendations: Found containers: ['recommendations-loading', 'recommendations-list', ...]
Cart updated, refreshing recommendations...
```

### 图片不显示或加载慢问题 ✅ (已修复)

**问题原因**：图片URL未使用Shopify优化参数

**修复效果**：
- ✅ 自动添加图片优化参数（width=300&height=300&crop=center）
- ✅ 支持Shopify CDN加速
- ✅ 设置图片尺寸属性防止布局偏移

### "API endpoint not configured" 错误

如果看到这个错误，请检查：

1. **确认配置正确** - 确保 `window.cartRecommendationsSettings` 已正确设置
2. **检查CDN地址** - 确保 `fallbackUrl` 使用 `{{ 'recommended-products-data.json' | asset_url }}` 生成的CDN地址
3. **检查数据文件** - 确认 `assets/recommended-products-data.json` 存在且格式正确
4. **验证路径** - 确保fetch请求使用CDN地址而不是 `/assets/...` 路径
5. **查看控制台** - 打开浏览器控制台查看详细的调试信息

### "Translation missing: en.cart_recommendations.add_to_cart" 错误

如果看到翻译缺失错误，说明代码中使用的翻译键路径与语言包中的实际位置不匹配。

**问题根因**：
- 代码中调用：`{{ 'cart_recommendations.add_to_cart' | t }}`
- 实际位置：`general.cart_recommendations.add_to_cart`

**解决方案** ✅ (已修复):
1. **修改代码中的翻译键路径** - 在所有翻译键前添加 `general.` 前缀
2. **修复的文件**：
   - `sections/cart-recommendations.liquid`
   - `snippets/cart-drawer.liquid`

**修复后的正确调用方式**:
```liquid
// 修复前（错误）
{{ 'cart_recommendations.add_to_cart' | t }}

// 修复后（正确）
{{ 'general.cart_recommendations.add_to_cart' | t }}
```

**修复的翻译键包括**：
- `general.cart_recommendations.add_to_cart` - "Add to cart" 按钮文本
- `general.cart_recommendations.error_message` - 错误消息
- `general.cart_recommendations.retry_button` - 重试按钮
- `general.cart_recommendations.empty_message` - 空推荐消息

**验证修复**：
修复后，推荐商品的"Add to cart"按钮将正确显示翻译文本，而不是"Translation missing"错误。

**测试步骤**：
1. 清除浏览器缓存
2. 访问购物车页面或打开购物车抽屉
3. 确认推荐栏显示正确的翻译文本：
   - 英文环境：显示"Add to cart"
   - 中文环境：显示"加入购物车"
4. 如果还看到错误消息，检查翻译键是否正确使用了`general.`前缀

### 数据请求失败 (404/CORS)

如果数据请求失败：

1. **检查网络请求** - 在浏览器开发者工具的Network标签中查看请求
2. **验证CDN地址** - 确认 `fallbackUrl` 指向正确的CDN地址
3. **检查CORS** - 如果使用外部API，确保设置了正确的CORS头
4. **验证JSON格式** - 确保返回的数据格式为 `{ "products": [...] }`

### 调试步骤

1. **打开浏览器开发者工具** (F12)
2. **查看Console标签** - 寻找 `CartRecommendations:` 开头的调试信息
3. **查看Network标签** - 检查数据文件是否成功加载
4. **检查元素** - 确认抽屉中存在推荐栏的HTML元素

**调试信息示例**:
```
CartRecommendations: Initializing with settings: {...}
CartRecommendations: Found elements: {...}
CartRecommendations: Using local data file
CartRecommendations: Local data loaded successfully {...}
```

### 快速测试

1. **直接访问数据文件** - 在浏览器中访问 `https://yourstore.com/assets/recommended-products-data.json` 确认数据可访问

2. **检查HTML元素** - 在抽屉中查找这些元素：
   - `drawer-recommendations-loading`
   - `drawer-recommendations-error`
   - `drawer-recommendations-list`

3. **验证配置** - 在浏览器控制台运行：
   ```javascript
   console.log(window.cartRecommendationsSettings);
   ```

4. **手动测试数据加载** - 在控制台运行：
   ```javascript
   fetch('/assets/recommended-products-data.json')
     .then(r => r.json())
     .then(d => console.log('Data loaded:', d));
   ```

## 性能优化建议

1. **API缓存**: 为API端点添加适当的缓存头
2. **图片优化**: 确保推荐商品图片已优化
3. **懒加载**: 图片已默认开启懒加载
4. **CDN**: 使用CDN加速静态资源

## 更新日志

### v1.3.0 (2024年12月全面优化)
- ✅ **修复图片加载问题** - 使用Shopify图片优化，支持responsive图片
- ✅ **修复购物车更新Loading问题** - 解决"Your cart"变动时推荐栏一直Loading的问题
- ✅ **优化容器查找机制** - 智能识别页面和抽屉中的推荐栏容器
- ✅ **解决ID冲突问题** - 使用唯一的drawer-前缀ID避免冲突
- ✅ **增强购物车事件监听** - 监听多种购物车更新事件，确保及时刷新
- ✅ **改进调试日志** - 添加详细的初始化和容器查找日志
- **修复的文件**：
  - `assets/cart-recommendations.js` - 核心逻辑优化
  - `snippets/cart-drawer.liquid` - 抽屉容器ID修复
  - `README.md` - 文档更新

### v1.2.0 (2024年12月购物车修复)
- ✅ **修复"Add to Cart"失败问题** - 解决点击加入购物车按钮时的错误
- ✅ **增强错误处理机制** - 添加详细的错误分析和用户反馈
- ✅ **优化演示数据处理** - 区分演示产品和真实产品，提供清晰指导
- ✅ **改进用户交互体验** - 添加加载状态和成功反馈
- ✅ **增强调试功能** - 添加详细的控制台日志用于问题排查
- **修复的文件**：
  - `assets/cart-recommendations.js`
  - `assets/recommended-products-data.json`
  - `README.md`

### v1.1.0 (2024年12月翻译修复)
- ✅ **修复翻译键路径不匹配问题** - 解决"Translation missing: en.cart_recommendations.add_to_cart"错误
- ✅ **更新所有翻译键路径** - 在翻译键前添加`general.`前缀以匹配语言包结构
- ✅ **优化错误处理** - 改进翻译缺失时的兜底机制
- ✅ **更新文档** - 添加详细的故障排除指南和修复步骤
- **修复的文件**：
  - `sections/cart-recommendations.liquid`
  - `snippets/cart-drawer.liquid`
  - `README.md`

### v1.0.0
- 初始版本发布
- 支持响应式设计
- 实现AJAX加载和购物车集成
- 添加多语言支持
- 包含完整的错误处理

## 技术支持

如有问题，请检查：
1. Shopify开发文档
2. 浏览器开发者工具
3. Shopify社区论坛

## 许可证

本项目遵循Shopify主题开发规范。

---

## 最新修复方案 (2024)

### 核心问题修复

根据用户反馈，我们实施了以下关键修复：

1. **CDN地址问题修复**
   - 使用 `{{ 'recommended-products-data.json' | asset_url }}` 生成正确的CDN地址
   - 避免使用 `/assets/...` 路径导致的404错误

2. **语言包补齐**
   - 添加了所有缺失的翻译key
   - 修复了 "Translation missing" 错误

3. **简化JS架构**
   - 重写JavaScript代码为更简洁的IIFE模式
   - 直接使用settings中的翻译字符串
   - 优化错误处理和重试逻辑

4. **数据格式标准化**
   - 确保推荐产品数据格式正确
   - 提供示例数据用于快速验证

### 验证修复效果

运行以下测试来验证修复：

```javascript
// 1. 检查配置
console.log(window.cartRecommendationsSettings);

// 2. 手动测试数据加载
fetch(window.cartRecommendationsSettings.fallbackUrl)
  .then(r => r.json())
  .then(d => console.log('数据加载成功:', d))
  .catch(e => console.error('数据加载失败:', e));

// 3. 检查翻译
console.log({
  error: window.cartRecommendationsSettings.strings.error,
  retry: window.cartRecommendationsSettings.strings.retry,
  addToCart: window.cartRecommendationsSettings.strings.addToCart
});

// 4. 测试翻译兜底（在浏览器控制台中测试Liquid兜底）
console.log('Testing translation fallback...');
console.log('Error message:', '{{ 'cart_recommendations.error_message' | t }}');
console.log('Retry button:', '{{ 'cart_recommendations.retry_button' | t }}');
```

## 测试指南

### 验证抽屉中推荐栏功能

1. **添加商品到购物车**
   - 访问网站任意商品页面
   - 点击"加入购物车"按钮
   - **重要**: 推荐栏只在购物车不为空时显示

2. **打开购物车抽屉**
   - 点击购物车图标打开抽屉
   - 确认抽屉完全展开

3. **验证推荐栏显示**
   - 检查抽屉中是否出现"Recommended for you"部分
   - 确认显示了Milkflow系列产品
   - 验证商品图片、价格、折扣信息正确显示

4. **测试交互功能**
   - 点击推荐商品的"加入购物车"按钮
   - 确认商品成功添加到购物车
   - 验证购物车数量更新

5. **检查控制台**
   - 打开浏览器开发者工具
   - 查看Network标签确认数据加载请求
   - 查看Console标签确认无JavaScript错误

### 预期行为

- ✅ 购物车抽屉打开后显示推荐栏
- ✅ 推荐栏显示3个商品（抽屉中限制数量）
- ✅ 商品以单列垂直布局显示
- ✅ 点击"加入购物车"按钮成功添加商品
- ✅ 无控制台错误或警告

**注意**: 请在生产环境部署前进行充分测试，确保功能正常运行。
