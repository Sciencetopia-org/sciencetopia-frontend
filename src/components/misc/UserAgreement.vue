<template>
  <main class="agreement-page">
    <article class="agreement-content">
      <h1>Sciencetopia 用户协议</h1>
      <p class="effective-date">生效日期：2026年5月31日</p>

      <p>
        欢迎使用 Sciencetopia。请您在注册、登录或使用本平台前，仔细阅读并充分理解本协议。
        当您勾选同意或继续使用本平台服务，即表示您已阅读、理解并同意接受本协议。
      </p>

      <section>
        <h2>一、账号注册与使用</h2>
        <p>
          您应使用真实、准确、合法、有效的信息注册账号，并妥善保管账号、密码、验证码及其他身份凭证。
          通过您的账号实施的操作，原则上视为您本人行为。
        </p>
      </section>

      <section>
        <h2>二、服务内容</h2>
        <p>
          Sciencetopia 提供知识网络、学习计划、学习小组、学习进度、资源推荐、消息通知、搜索、
          内容生成或辅助学习等服务。平台可能根据产品功能、监管要求或运营需要调整服务内容。
        </p>
      </section>

      <section>
        <h2>三、用户行为规范</h2>
        <p>
          您不得发布违法违规、侵害他人权益、虚假误导、恶意攻击、色情低俗、赌博诈骗、恶意营销或其他不当内容；
          不得破坏平台系统安全、扰乱平台秩序、盗用账号或侵犯他人合法权益。
        </p>
      </section>

      <section>
        <h2>四、用户内容与知识产权</h2>
        <p>
          您应确保上传、发布或创建的内容来源合法且不侵害第三方权益。为提供、展示、存储、搜索、推荐、
          审核和维护服务，您授权平台在必要范围内使用您提交的内容。
        </p>
      </section>

      <section>
        <h2>五、AI 辅助与推荐服务</h2>
        <p>
          平台可能使用算法或人工智能技术提供学习辅助、资源推荐、内容摘要或问答服务。相关输出仅供学习参考，
          不构成专业意见，您应自行判断其准确性、完整性和适用性。
        </p>
      </section>

      <section>
        <h2>六、个人信息保护</h2>
        <p>
          平台将依法处理您的个人信息，并遵循合法、正当、必要、诚信、公开透明、目的明确、最小必要和安全保护原则。
          您依法享有查询、复制、更正、补充、删除个人信息，撤回同意和注销账号等权利。
        </p>
      </section>

      <section>
        <h2>七、未成年人保护</h2>
        <p>
          未满十八周岁的用户应在监护人阅读、理解并同意本协议后使用平台服务，并在监护人指导下合理使用学习功能。
        </p>
      </section>

      <section>
        <h2>八、免责声明与争议解决</h2>
        <p>
          平台将在合理范围内保障服务稳定和安全，但不对服务不中断、无错误或完全满足您的需求作绝对保证。
          因本协议或平台服务产生的争议，双方应先友好协商解决；协商不成的，依法向有管辖权的人民法院提起诉讼。
        </p>
      </section>

      <p class="notice">
        完整协议正文请以平台正式发布版本为准。正式上线前，建议结合实际运营主体、数据处理方式和部署地区由专业法律顾问复核。
      </p>
    </article>
  </main>
</template>

<script>
export default {
  name: 'UserAgreement',
}
</script>

<style scoped>
.agreement-page {
  min-height: 100vh;
  padding: 48px 20px;
  background: #f8f4eb;
}

.agreement-content {
  max-width: 860px;
  margin: 0 auto;
  color: #2f2a23;
  font-size: 15px;
  line-height: 1.8;
}

.agreement-content h1 {
  margin-bottom: 4px;
  font-size: 30px;
}

.effective-date {
  margin-bottom: 28px;
  color: #766b5b;
}

.agreement-content h2 {
  margin-top: 28px;
  margin-bottom: 8px;
  font-size: 19px;
}

.notice {
  margin-top: 32px;
  padding-top: 18px;
  border-top: 1px solid rgba(47, 42, 35, 0.18);
  color: #6b5f51;
}
</style>
