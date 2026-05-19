<template>
  <v-dialog
    v-model="internalDialog"
    class="edit-guide-dialog"
    max-width="960"
    z-index="20000"
    persistent
    @click:outside="triggerWink"
  >
    <v-card
      :class="['sc-dialog-card', 'edit-guide-card', { wink: isWinking }]"
      @animationend="isWinking = false"
    >
      <v-card-title class="text-h5 edit-guide-title">编辑指南</v-card-title>
      <v-card-text class="sc-dialog-body edit-guide-body">
        <p>在编辑之前，请阅读我们的编辑指南。</p>
        <v-container fluid>
          <h4>1. 创建新的知识节点</h4>
          <v-row justify="center" align="center" dense>
            <v-col cols="auto" class="d-flex justify-center align-center">
              <v-card class="svg-card">
                <v-card-text>
                  <img
                    src="../../assets/images/EditGuide/resource3.svg"
                    alt="resource3"
                    class="svg-figure"
                  />
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="auto" class="d-flex justify-center align-center">
              <v-card class="svg-card">
                <v-card-text>
                  <img
                    src="../../assets/images/EditGuide/resource14.svg"
                    alt="resource6"
                    class="svg-figure"
                  />
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="auto" class="d-flex justify-center align-center">
              <v-card class="svg-card">
                <v-card-text>
                  <img
                    src="../../assets/images/EditGuide/resource7.svg"
                    alt="resource7"
                    class="svg-figure"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-spacer class="my-5"></v-spacer>
          <h4>2. 为两个知识节点间创建新的边</h4>
          <v-row justify="center" align="center" dense>
            <v-col cols="auto" class="d-flex justify-center align-center">
              <v-card class="svg-card">
                <v-card-text>
                  <img
                    src="../../assets/images/EditGuide/resource16.svg"
                    alt="resource8"
                    class="svg-figure"
                  />
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="auto" class="d-flex justify-center align-center">
              <v-card class="svg-card">
                <v-card-text>
                  <img
                    src="../../assets/images/EditGuide/resource19.svg"
                    alt="resource11"
                    class="svg-figure"
                  />
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="auto" class="d-flex justify-center align-center">
              <v-card class="svg-card">
                <v-card-text>
                  <img
                    src="../../assets/images/EditGuide/resource17.svg"
                    alt="resource9"
                    class="svg-figure"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
        <div class="edit-guide-note">
          请确保您已经阅读并理解了为知识网络添加新节点和节点间的边的操作。Scienetopia知识网络是公开的、共享的知识网络，您所添加的节点和边将会被录入这个知识库里，向所有学习者公开。请对您所添加的知识节点和边负有责任，我们期待您做出高质量的贡献，让我们一起营造一个更好的Sicentopia共享知识网络和更好的Sciencetopia社区。
          <v-checkbox
            v-model="agreed"
            label="我已阅读、知晓并同意"
          ></v-checkbox>
        </div>
      </v-card-text>
      <v-card-actions class="sc-form-actions sc-form-actions--end edit-guide-actions">
        <v-spacer></v-spacer>
        <v-btn class="sc-action-btn" color="primary" variant="tonal" @click="cancel">取消</v-btn>
        <v-btn class="sc-action-btn" color="primary" variant="flat" :disabled="!agreed" @click="confirm">确认</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    internalDialog: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },
  },
  data() {
    return {
      agreed: false,
      isWinking: false,
    }
  },
  methods: {
    confirm() {
      this.$emit('confirmed') // 触发确认事件
      this.internalDialog = false // 关闭对话框
    },
    cancel() {
      this.internalDialog = false // 直接关闭对话框，不需要触发外部事件
    },
    triggerWink() {
      this.isWinking = true
    },
  },
}
</script>

<style scoped>
.svg-card {
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 10px;
}

.svg-figure {
  width: auto;
  height: 200px;
}

.edit-guide-dialog :deep(.v-overlay__content) {
  width: min(960px, calc(100vw - 64px)) !important;
  max-height: calc(100dvh - 64px) !important;
  margin: 32px !important;
}

.edit-guide-card {
  background: white;
  width: 100%;
  border-radius: 8px !important;
  text-align: center;
  transition: transform 0.2s ease-in-out;
}

.edit-guide-title {
  padding: 24px 28px 12px !important;
}

.edit-guide-body {
  padding: 0 28px 12px !important;
}

.edit-guide-note {
  padding: 2% 8% 0;
}

.edit-guide-actions {
  padding: 12px 28px 24px !important;
}

@media (max-width: 600px) {
  .edit-guide-dialog :deep(.v-overlay__content) {
    width: calc(100vw - 32px) !important;
    max-height: calc(100dvh - 32px) !important;
    margin: 16px !important;
  }

  .edit-guide-title,
  .edit-guide-body,
  .edit-guide-actions {
    padding-left: 18px !important;
    padding-right: 18px !important;
  }
}

.wink {
  animation: wink 0.1s ease-in-out;
}

@keyframes wink {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.97);
  }
}
</style>
