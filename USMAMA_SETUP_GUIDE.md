# USMAMA 隐藏页面设置指南

## 🎯 快速开始

### 第一步：在 Shopify 后台创建页面
1. 登录 Shopify 后台
2. 导航到 **在线商店 > 页面**
3. 点击 **添加页面**
4. 填写以下信息：
   - **标题**: USMAMA
   - **URL 句柄**: usmama （重要：必须是 usmama）
   - **内容**: 可以留空或添加简单描述
   - **搜索引擎优化**: 不勾选"在搜索结果中显示"
5. 在 **页面模板** 下拉菜单中选择 **page.usmama**
6. 点击 **保存**

### 第二步：验证设置
1. 访问 `https://你的域名.com/pages/usmama`（不带密钥）
   - 应该显示 "Access Restricted" 消息
2. 访问 `https://你的域名.com/pages/usmama?key=xyz`（带密钥）
   - 应该显示产品列表

## 🔧 配置选项

### 修改访问密钥
1. 打开 `templates/page.usmama.liquid`
2. 找到以下代码：
   ```javascript
   const SECRET_KEY = 'xyz';
   ```
3. 将 'xyz' 替换为您想要的密钥
4. 保存文件

### 修改展示的产品
1. 打开 `templates/page.usmama.liquid`
2. 找到以下代码：
   ```liquid
   assign product1 = all_products['milkflow-drinkmix']
   assign product2 = all_products['milkflow-soft-chew']
   ```
3. 将产品 handle 替换为实际的产品 handle
4. 保存文件

### 产品 Handle 查找方法
1. 在 Shopify 后台进入 **产品**
2. 点击要展示的产品
3. 在地址栏中查看 URL，格式如：`/admin/products/123456789`
4. 或者在产品页面的 **搜索引擎优化** 部分查看 URL 句柄

## 🎨 样式自定义

### 修改网格布局
在 `templates/page.usmama.liquid` 中找到：
```liquid
class="grid product-grid grid--2-col-desktop grid--1-col-tablet-down"
```

可选的列数类：
- `grid--1-col-desktop` - 桌面端1列
- `grid--2-col-desktop` - 桌面端2列
- `grid--3-col-desktop` - 桌面端3列
- `grid--4-col-desktop` - 桌面端4列

### 修改产品卡片选项
在 `card-product` render 调用中可以修改：
```liquid
{% render 'card-product',
   card_product: product1,
   media_aspect_ratio: 'square',    # 'square', 'portrait', 'adapt'
   show_secondary_image: false,     # true/false
   show_vendor: false,              # true/false
   show_rating: false,              # true/false
   show_quick_add: true,            # true/false
   section_id: 'usmama-product-1',
   lazy_load: false
%}
```

## 🔒 安全和隐私

### 已实现的安全措施
1. ✅ 前端密钥验证
2. ✅ noindex meta 标签（搜索引擎不索引）
3. ✅ nofollow meta 标签（搜索引擎不跟踪链接）
4. ✅ 不在站点导航中出现
5. ✅ 默认显示访问拒绝消息

### 可选的额外安全措施
1. **启用自动重定向**：
   在 `templates/page.usmama.liquid` 中取消注释：
   ```javascript
   // setTimeout(function() {
   //   window.location.href = '/404';
   // }, 2000);
   ```

2. **隐藏 URL 中的密钥**：
   取消注释以下代码以在验证后移除密钥：
   ```javascript
   // if (window.history && window.history.replaceState) {
   //   const cleanUrl = window.location.pathname;
   //   window.history.replaceState({}, document.title, cleanUrl);
   // }
   ```

## 🛠️ 故障排除

### 问题：页面显示 404 错误
**解决方案：**
1. 确认在 Shopify 后台创建了页面
2. 确认页面 URL 句柄是 "usmama"
3. 确认选择了正确的模板 "page.usmama"

### 问题：产品不显示
**解决方案：**
1. 检查产品 handle 是否正确
2. 确认产品已发布且可用
3. 检查产品库存状态

### 问题：样式显示异常
**解决方案：**
1. 确认所有 CSS 文件存在于 assets 文件夹
2. 检查浏览器控制台是否有错误
3. 清除浏览器缓存

### 问题：快速加购不工作
**解决方案：**
1. 确认 JavaScript 文件已正确加载
2. 检查浏览器控制台是否有 JavaScript 错误
3. 确认主题支持快速加购功能

## 📱 移动端优化

页面已自动适配移动端：
- 桌面端：2列显示
- 平板和手机：1列显示
- 响应式图片和间距
- 触屏友好的按钮

## 🔄 维护和更新

### 定期检查项目
1. **每月检查**：
   - 验证页面访问正常
   - 确认产品信息准确
   - 检查链接有效性

2. **产品更新时**：
   - 更新产品 handle（如果变更）
   - 检查产品图片和描述
   - 测试购买流程

3. **密钥管理**：
   - 定期更换访问密钥
   - 更新分享的链接
   - 撤销旧的访问权限

## 📊 使用统计

要追踪页面使用情况，可以：
1. 使用 Google Analytics 事件追踪
2. 添加自定义日志记录
3. 监控 Shopify 分析数据

## 🚀 高级功能扩展

### 添加更多产品
1. 在模板中添加更多产品变量
2. 在产品网格中添加对应的渲染块
3. 更新配置文件

### 多密钥支持
可以修改 JavaScript 验证逻辑支持多个密钥：
```javascript
const VALID_KEYS = ['xyz', 'abc', 'def'];
if (VALID_KEYS.includes(providedKey)) {
  // 显示内容
}
```

### 时间限制访问
添加时间验证逻辑：
```javascript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');
const now = new Date();
if (now >= startDate && now <= endDate && providedKey === SECRET_KEY) {
  // 显示内容
}
```

## 📞 支持

如果遇到问题，请检查：
1. Shopify 主题文档
2. 浏览器开发者工具控制台
3. Shopify 系统状态页面

---

**记住：** 这是一个隐藏页面，不要在公开场所分享带有密钥的链接！
