<template>
  <footer style="background-color: unset">
    <p class="bottom-footer-btn">&copy; {{ $t('footer.copy') }}</p>
    <nav>
      <ul>
        <li>
          <a href="/about" class="bottom-footer-btn">{{
            $t('footer.about')
          }}</a>
        </li>
        <li>
          <a href="/contact" class="bottom-footer-btn">{{
            $t('footer.contact')
          }}</a>
        </li>
        <!-- <li><a href="/privacy">隐私政策</a></li>
        <li><a href="/terms">服务条款</a></li> -->
        <li>
          <a href="/support" class="bottom-footer-btn">{{
            $t('footer.donate')
          }}</a>
        </li>
      </ul>
    </nav>
  </footer>
</template>

<script>
export default {
  name: 'DefaultFooterBar',
  data() {
    return {}
  },
  methods: {},
}
</script>

<style scoped></style>
