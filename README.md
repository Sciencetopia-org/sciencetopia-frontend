# Sciencetopia 前端

## 概述
Sciencetopia是一个搜罗全网开源学习资源，以为群众提供系统性的、免费的自学服务的交互式网页应用。它提供了一个动态的知识网络，并根据用户的偏好和需求生成个性化学习计划。

## 特点
- **交互式知识网络**：可视化并与知识领域的网络进行交互。
- **个性化学习计划**：根据用户偏好和需求生成定制学习计划。
- **用户认证**：安全的登录和注册功能。
- **用户个性化**：个人中心，用户可以管理他们的偏好和学习计划。

## 技术栈
- **Vue.js**：用于构建用户界面的渐进式JavaScript框架。
- **Vuex**：Vue.js应用的状态管理模式+库。
- **Vuetify**：Vue.js的Material Design组件框架。
- **Axios**：基于Promise的HTTP客户端，用于发出HTTP请求。
- **Font Awesome**：图标库，用于UI增强。

## 项目结构
- `src/`：应用的源文件。
  - `App.vue`：主应用组件。
  - `main.js`：Vue.js应用的入口点。
  - `router/index.js`：定义应用的路由。
  - `store.js`：Vuex状态管理。
  - `api.js`：API调用的Axios实例。
  - `components/`：各种功能的Vue组件，如知识网络、学习计划、登录等。
  - `views/`：不同视图/页面的Vue组件。
  - `assets/`：包含CSS和图像。
- `public/`：公共资源，如favicon和index.html。
- `package.json`：NPM包配置。

## 安装和设置
1. **克隆仓库**：`git clone https://github.com/Sciencetopia-org/sciencetopia-frontend.git`
2. **安装依赖**：在项目目录中运行`npm install`。
3. **运行应用**：执行`npm run serve`以启动开发服务器。

### 开发环境使用 Mock 数据

项目支持在开发环境下为部分 GET 接口使用 `public/mock` 下的 JSON 作为数据源（仅拦截有对应文件的接口，其余仍走真实后端）。

启用方式（二选一）：

- 在项目根目录创建 `.env.development` 文件，内容：

```
VUE_APP_USE_MOCKS=true
```

- 或在启动命令前导出环境变量：

```bash
VUE_APP_USE_MOCKS=true npm run serve
```

当前已映射的接口与文件请参见 `public/mock/README.md`。
