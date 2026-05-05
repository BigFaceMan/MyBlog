<template>
  <section class="sidebar-card author-card">
    <template v-if="siteStore.profile">
      <img class="author-card__avatar" :src="siteStore.profile.avatar" :alt="siteStore.profile.name" />
      <h2 class="author-card__name">{{ siteStore.profile.name }}</h2>
      <p class="author-card__subtitle">{{ siteStore.profile.subtitle }}</p>

      <div class="author-card__stats">
        <RouterLink class="author-card__stat" to="/">
          <strong>{{ siteStore.profile.stats.articles }}</strong>
          <span>{{ t("sidebar.articles") }}</span>
        </RouterLink>
        <RouterLink class="author-card__stat" to="/tags">
          <strong>{{ siteStore.profile.stats.tags }}</strong>
          <span>{{ t("sidebar.tags") }}</span>
        </RouterLink>
        <RouterLink class="author-card__stat" to="/categories">
          <strong>{{ siteStore.profile.stats.categories }}</strong>
          <span>{{ t("sidebar.categories") }}</span>
        </RouterLink>
      </div>

      <a class="author-card__follow" :href="siteStore.profile.socials[0]?.url" target="_blank" rel="noreferrer">
        <Link :size="16" />
        {{ t("sidebar.follow") }}
      </a>

      <div class="author-card__socials">
        <a v-for="social in siteStore.profile.socials" :key="social.type" :href="social.url" :aria-label="social.label" target="_blank" rel="noreferrer">
          <component :is="socialIconMap[social.type]" :size="19" />
        </a>
      </div>
    </template>
    <el-skeleton v-else :rows="5" animated />
  </section>
</template>

<script setup lang="ts">
import { useSiteStore } from "@/stores/site";
import { ChatDotRound, Link, Message, Promotion, Share } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const siteStore = useSiteStore();
const socialIconMap = {
  github: Share,
  mail: Message,
  rss: Promotion,
  twitter: ChatDotRound
};
</script>

<style scoped>
.author-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.author-card__avatar {
  width: 112px;
  height: 112px;
  object-fit: cover;
  border: 4px solid var(--card-bg);
  border-radius: 999px;
  box-shadow: var(--shadow-avatar);
}

.author-card__name {
  margin: 14px 0 4px;
  color: var(--text-primary);
  font-size: 25px;
}

.author-card__subtitle {
  margin: 0;
  color: var(--text-regular);
}

.author-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  margin: 24px 0 18px;
}

.author-card__stat {
  color: var(--text-primary);
  text-decoration: none;
}

.author-card__stat strong,
.author-card__stat span {
  display: block;
}

.author-card__stat strong {
  font-size: 22px;
}

.author-card__stat span {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}

.author-card__follow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  color: white;
  font-weight: 700;
  text-decoration: none;
  background: var(--primary-color);
  border-radius: 6px;
  transition: var(--animation-fast);
}

.author-card__follow :deep(svg) {
  display: block;
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
}

.author-card__follow:hover {
  background: var(--primary-hover);
}

.author-card__socials {
  display: flex;
  justify-content: center;
  gap: 22px;
  margin-top: 18px;
}

.author-card__socials a {
  display: inline-flex;
  color: var(--text-regular);
  transition: var(--animation-fast);
}

.author-card__socials :deep(svg) {
  display: block;
  width: 19px;
  height: 19px;
}

.author-card__socials a:hover {
  color: var(--primary-color);
}
</style>
