<template>
  <PageShell :with-sidebar="false">
    <StateBlock v-if="siteStore.loading && !profile" type="loading" :title="t('common.loading')" />
    <StateBlock v-else-if="siteStore.error" type="error" :title="t('state.loadFailed')" :description="siteStore.error" :action-text="t('common.retry')" @action="siteStore.loadProfile" />
    <section v-else-if="profile" class="about-page">
      <div class="about-hero">
        <img class="about-hero__avatar" :src="profile.avatar" :alt="profile.name" />
        <div class="about-hero__content">
          <p class="about-hero__eyebrow">{{ t("page.aboutTitle") }}</p>
          <h1>{{ profile.name }}</h1>
          <p class="about-hero__subtitle">{{ profile.subtitle }}</p>
          <p class="about-hero__intro">{{ profile.announcement }}</p>
        </div>
      </div>

      <div class="about-content">
        <section class="about-section">
          <h2>自我介绍</h2>
          <p>
            这里记录我的工程实践、阅读笔记、生活观察和阶段性复盘。博客会先保持轻量，把真正写过、想清楚、值得回看的内容留下来。
          </p>
          <p>
            如果你想了解我最近关注什么，可以从文章、分类和标签开始；如果想联系我，可以通过下面的链接找到我。
          </p>
        </section>

        <section class="about-section about-section--stats">
          <RouterLink class="about-stat" to="/">
            <strong>{{ profile.stats.articles }}</strong>
            <span>文章</span>
          </RouterLink>
          <RouterLink class="about-stat" to="/categories">
            <strong>{{ profile.stats.categories }}</strong>
            <span>分类</span>
          </RouterLink>
          <RouterLink class="about-stat" to="/tags">
            <strong>{{ profile.stats.tags }}</strong>
            <span>标签</span>
          </RouterLink>
        </section>

        <section class="about-section">
          <h2>联系</h2>
          <div class="about-links">
            <a v-for="social in profile.socials" :key="social.type" :href="social.url" target="_blank" rel="noreferrer">
              <component :is="socialIconMap[social.type]" :size="18" />
              <span>{{ social.label }}</span>
            </a>
          </div>
        </section>
      </div>
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import { useSiteStore } from "@/stores/site";
import { ChatDotRound, Message, Promotion, Share } from "@element-plus/icons-vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const siteStore = useSiteStore();
const profile = computed(() => siteStore.profile);
const socialIconMap = {
  github: Share,
  mail: Message,
  rss: Promotion,
  twitter: ChatDotRound
};

void siteStore.loadProfile();
</script>

<style scoped>
.about-page {
  display: grid;
  gap: 18px;
}

.about-hero,
.about-content {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.about-hero {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  gap: 28px;
  align-items: center;
  padding: clamp(24px, 5vw, 46px);
}

.about-hero__avatar {
  width: 148px;
  height: 148px;
  object-fit: cover;
  border: 5px solid var(--card-bg);
  border-radius: 999px;
  box-shadow: var(--shadow-avatar);
}

.about-hero__eyebrow {
  margin: 0 0 8px;
  color: var(--primary-color);
  font-weight: 800;
}

.about-hero h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.1;
}

.about-hero__subtitle {
  margin: 12px 0 0;
  color: var(--text-regular);
  font-size: 18px;
}

.about-hero__intro {
  max-width: 680px;
  margin: 16px 0 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.about-content {
  display: grid;
  gap: 24px;
  padding: clamp(22px, 4vw, 34px);
}

.about-section h2 {
  margin: 0 0 12px;
  color: var(--text-primary);
  font-size: 22px;
}

.about-section p {
  max-width: 760px;
  margin: 0;
  color: var(--text-regular);
  line-height: 1.9;
}

.about-section p + p {
  margin-top: 10px;
}

.about-section--stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.about-stat {
  display: grid;
  gap: 4px;
  min-height: 84px;
  align-content: center;
  padding: 18px;
  color: var(--text-primary);
  text-align: center;
  text-decoration: none;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: var(--animation-fast);
}

.about-stat:hover {
  color: var(--primary-color);
  border-color: var(--primary-border);
}

.about-stat strong {
  font-size: 28px;
}

.about-stat span {
  color: var(--text-secondary);
}

.about-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.about-links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 13px;
  color: var(--text-primary);
  font-weight: 700;
  text-decoration: none;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: var(--animation-fast);
}

.about-links a:hover {
  color: var(--primary-color);
  border-color: var(--primary-border);
}

.about-links :deep(svg) {
  display: block;
  width: 18px;
  height: 18px;
}

@media (max-width: 700px) {
  .about-hero {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .about-hero__avatar {
    width: 112px;
    height: 112px;
  }

  .about-section--stats {
    grid-template-columns: 1fr;
  }
}
</style>
