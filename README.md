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
   - **API Endpoint URL**: 推荐商品数据接口URL
   - **Maximum Products**: 最大显示商品数量（1-20，默认6）

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

### 加入购物车失败

1. 确认variant_id正确
2. 检查商品是否有库存
3. 验证Shopify AJAX Cart API是否可用

### 样式问题

1. 确认CSS文件已正确加载
2. 检查是否有CSS冲突
3. 使用浏览器开发者工具调试

## 性能优化建议

1. **API缓存**: 为API端点添加适当的缓存头
2. **图片优化**: 确保推荐商品图片已优化
3. **懒加载**: 图片已默认开启懒加载
4. **CDN**: 使用CDN加速静态资源

## 更新日志

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

**注意**: 请在生产环境部署前进行充分测试，确保功能正常运行。
