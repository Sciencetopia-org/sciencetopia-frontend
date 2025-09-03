<template>
  <div class="icon-item" @click.prevent="handleClick" role="button" tabindex="0" @keydown.enter.prevent="handleClick"
    :aria-label="computedLabel" :data-tooltip="computedLabel">
    <v-tooltip :text="computedLabel" location="right" open-delay="300">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          class="icon-btn"
          :class="{ 'icon-btn--active': active }"
          variant="text"
          :disabled="disabled"
          :aria-label="computedLabel"
        >
          <v-icon :size="computedIconSize">{{ computedIcon }}</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- 纯图标设计，移除标签显示 -->
  </div>
</template>
<script>
export default {
  name: 'ReusableIconButton',
  props: {
    icon: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    dynamicIcon: {
      type: String,
      default: '',
    },
    dynamicLabel: {
      type: String,
      default: '',
    },
    iconSize: {
      type: Number,
      default: 24,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showLabel: {
      type: Boolean,
      default: true,
    },
    isSmallScreenProp: {
      // 父组件传递的备用值
      type: Boolean,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isSmallScreenLocal: window.innerWidth <= 1200, // 初始判断屏幕大小
    }
  },
  computed: {
    // 优先使用内部判断的值，如果父组件传参了，则使用父组件的值
    isSmallScreen() {
      return this.isSmallScreenProp !== null
        ? this.isSmallScreenProp
        : this.isSmallScreenLocal
    },
    computedIcon() {
      return this.dynamicIcon || this.icon
    },
    computedLabel() {
      return this.dynamicLabel || this.label
    },
    computedIconSize() {
      return this.iconSize
    },
  },
  methods: {
    handleClick() {
      if (!this.disabled) {
        this.$emit('click')
      }
    },
    handleResize() {
      // 更新屏幕大小的状态
      this.isSmallScreenLocal = window.innerWidth <= 1200
    },
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize)
  },
}
</script>
<style scoped>
.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

/* 按钮本身 */
.icon-btn {
  width: 48px !important;
  height: 48px !important;
  min-width: 0 !important;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  aspect-ratio: 1 / 1;
}

.icon-btn:hover {
  transform: scale(1.1);
  background-color: #FAF6F0;
}

.icon-btn:active {
  transform: scale(0.95);
}

/* 选中高亮为浅色正圆 */
.icon-btn--active {
  background-color: #F1E9D7 !important;
  border-radius: 50% !important;
}

/* 移除图标下方文字 */
.icon-label {
  display: none;
}

/* 中屏 */
@media (max-width: 1200px) {
  .icon-btn {
    width: 42px;
    height: 42px;
  }
}

/* 小屏 */
@media (max-width: 800px) {
  .icon-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
