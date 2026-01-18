<template>
  <div v-if="internalDialog" class="custom-overlay" @click.self="triggerWink">
    <v-card
      :class="['overlay-content', { wink: isWinking }]"
      @animationend="isWinking = false"
    >
      <v-card-title class="text-h5">编辑指南</v-card-title>
      <v-card-text class="scrollable-content">
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
        <v-card-text
          style="padding-left: 8%; padding-right: 8%; padding-top: 2%"
        >
          请确保您已经阅读并理解了为知识网络添加新节点和节点间的边的操作。Scienetopia知识网络是公开的、共享的知识网络，您所添加的节点和边将会被录入这个知识库里，向所有学习者公开。请对您所添加的知识节点和边负有责任，我们期待您做出高质量的贡献，让我们一起营造一个更好的Sicentopia共享知识网络和更好的Sciencetopia社区。
          <v-checkbox
            v-model="agreed"
            label="我已阅读、知晓并同意"
          ></v-checkbox>
        </v-card-text>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey darken-1" text @click="cancel">取消</v-btn>
        <v-btn color="primary" :disabled="!agreed" @click="confirm">确认</v-btn>
      </v-card-actions>
    </v-card>
  </div>
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

.custom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200000;
}

.overlay-content {
  max-height: 90vh;
  background: white;
  padding: 20px;
  width: 60vw;
  text-align: center;
  transition: transform 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.scrollable-content {
  max-height: 70vh;
  /* Adjust the height as needed */
  overflow-y: auto;
  padding-right: 10px;
  /* Optional for better scrolling experience */
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
