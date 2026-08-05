<template>
  <v-card class="st-card">
    <v-img
      class="group-image"
      :src="resolveGroupImage(group.imageUrl)"
      aspect-ratio="16/9"
      cover
      @click="$emit('open', group.id)"
    />
    <v-card-title>
      <button class="group-name" @click="$emit('open', group.id)">
        {{ group.name }}
      </button>
    </v-card-title>
    <v-card-text class="group-description">
      {{ stripHtml(group.description) }}
    </v-card-text>
    <div v-if="badges.length" class="group-tags">
      <v-chip
        v-for="badge in badges"
        :key="badge.key"
        size="x-small"
        :color="badge.color"
        :variant="badge.variant"
        label
        class="mr-1 mb-1"
      >
        {{ badge.label }}
      </v-chip>
    </div>
    <div v-if="group.tags && group.tags.length" class="group-tags">
      <v-chip
        v-for="tag in group.tags"
        :key="tag.id || tag.name"
        size="x-small"
        label
        class="mr-1 mb-1"
      >
        {{ tag.name }}
      </v-chip>
    </div>
    <v-card-text v-if="group.recommendationReason" class="group-reason">
      {{ group.recommendationReason }}
    </v-card-text>
    <v-card-text v-if="typeof group.memberCount === 'number'" class="group-meta">
      {{ group.memberCount }} {{ $t('studygroup.groupmember') }}
    </v-card-text>
    <v-card-text v-if="hasMembers" class="group-members">
      {{ $t('studygroup.groupmember') }}{{ $t(':') }}
      <div class="member-list">
        <v-btn
          v-for="member in group.members"
          :key="member.id || member.userName"
          icon
          class="default-avatar"
          size="38"
          @click="$emit('profile', member.id)"
        >
          <v-avatar size="36">
            <img :src="resolveMemberAvatar(member.avatarUrl)" :alt="$t('user.useravatar')" />
          </v-avatar>
        </v-btn>
      </div>
    </v-card-text>
    <v-card-actions>
      <template v-if="actionMode === 'join'">
        <v-btn v-if="group.isMember" color="primary" text disabled>
          {{ $t('studygroup.joined') }}
        </v-btn>
        <v-btn v-else-if="group.hasApplied" color="primary" text disabled>
          {{ $t('studygroup.applied') }}
        </v-btn>
        <v-btn v-else color="primary" text @click="$emit('apply', group.id)">
          {{ $t('studygroup.applytojoin') }}
        </v-btn>
      </template>
      <v-btn v-else color="primary" text @click="$emit('open', group.id)">
        {{ $t('showdetail') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { safeUrl, stripHtml } from '@/utils/text'

export default {
  name: 'StudyGroupCard',
  props: {
    group: {
      type: Object,
      required: true,
    },
    actionMode: {
      type: String,
      default: 'join',
      validator: value => ['join', 'detail'].includes(value),
    },
  },
  emits: ['open', 'apply', 'profile'],
  computed: {
    hasMembers() {
      return Array.isArray(this.group.members) && this.group.members.length > 0
    },
    badges() {
      const items = []
      if (this.group.role) {
        items.push({
          key: 'role',
          label: this.group.role,
          color: undefined,
          variant: 'outlined',
        })
      }
      if (this.group.status === 'pending_approval') {
        items.push({
          key: 'status',
          label: this.group.status,
          color: 'red',
          variant: 'outlined',
        })
      }
      return items
    },
  },
  methods: {
    resolveGroupImage(imageUrl) {
      const fallback = require('@/assets/images/default_study_group.png')
      if (!imageUrl) return fallback
      const src = String(imageUrl).trim()
      const safeSrc = safeUrl(src, '')
      if (safeSrc) return safeSrc
      try {
        return require(`@/assets/images/${src}`)
      } catch (_) {
        return fallback
      }
    },
    resolveMemberAvatar(avatarUrl) {
      const src = String(avatarUrl || '').trim()
      return safeUrl(src, require('@/assets/images/avatar.svg'))
    },
    stripHtml(html) {
      return stripHtml(html)
    },
  },
}
</script>

<style scoped>
@import '../../assets/css/avatar.css';

.st-card {
  overflow: hidden;
}

.group-image {
  border-radius: 4px 4px 0 0;
  margin-bottom: 8px;
  cursor: pointer;
}

.group-name {
  font-weight: bold;
  font-size: 1.2rem;
  color: #1c2b42;
  text-align: left;
  margin: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.group-name:hover {
  color: #304e75;
}

.group-description {
  font-size: 0.9rem;
  color: #304e75;
}

.group-tags {
  padding: 0 16px 4px;
}

.group-reason {
  padding-top: 2px;
  padding-bottom: 2px;
  font-size: 0.82rem;
  color: #6b4f12;
}

.group-meta {
  padding-top: 2px;
  padding-bottom: 2px;
  font-size: 0.82rem;
  color: #607086;
}

.group-members {
  color: #4a4a4a;
}

.member-list {
  display: flex;
  gap: 5px;
}
</style>
