// router.js
import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store/store.js'
import HomePageVue from '@/views/HomePage.vue'
// import SearchListPage from '@/views/SearchListPage.vue'
import LogIn from '@/components/LogIn.vue'
import ReGister from '@/components/ReGister.vue'
import PersonalCenter from '@/components/PersonalCenter.vue'
import MessageCenter from '@/components/MessageCenter.vue'
import AccountCenter from '@/components/AccountCenter.vue'
import StudyGroupList from '@/components/StudyGroup/StudyGroupList.vue'
import StudyGroupPage from '@/components/StudyGroup/StudyGroupPage.vue'
// import StudyGroupSpace from '@/components/StudyGroup/StudyGroupSpace.vue'
import CreateStudyGroup from '@/components/StudyGroup/CreateStudyGroup.vue'
// import ManagePanel from '@/components/StudyGroup/ManagePanel.vue'; // Update with the correct path
import SponsorShip from '@/components/SponsorShip.vue'
import AboutUs from '@/components/AboutUs.vue'
import ContactUs from '@/components/ContactUs.vue'
import TestHeight from '@/components/TestHeight.vue'
import StudyPlanDetail from '@/components/StudyPlanDetail.vue'
// import SearchBarVue from '@/components/search/SearchBar.vue'
// import SearchResultItemVue from '@/components/search/SearchResultItem.vue'
import SearchResultsVue from '@/components/search/SearchResults.vue'

const routes = [
  {
    path: '/testHeight',
    name: 'testHeight',
    component: TestHeight,
  },
  {
    path: '/',
    name: 'HomePage',
    component: HomePageVue,
    meta: { background: 'lighter' }
  },
  {
    path: '/search',
    name: 'searchList',
    component: SearchResultsVue,
    props: route => ({ query: route.query.q }),
  },
  {
    path: '/login',
    name: 'login',
    component: LogIn,
    meta: { layout: 'simplest' },
  },
  {
    path: '/register',
    name: 'register',
    component: ReGister,
    meta: { layout: 'simplest' },
  },
  {
    path: '/:userId',
    name: 'personalcenter',
    component: PersonalCenter,
    props: true,
  },
  {
    path: '/:userId/:studyPlanId',
    name: 'StudyPlanDetail',
    component: StudyPlanDetail,
    props: true,
  },
  {
    path: '/:userId/message',
    name: 'messagecenter',
    component: MessageCenter,
    props: true,
    children: [
      {
        path: 'directMessages',
        name: 'directMessages',
        component: MessageCenter,
        props: (route) => ({ userId: route.params.userId }),
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: MessageCenter,
        props: (route) => ({ userId: route.params.userId }),
      },
    ],
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/messages/directMessages',
  },
  {
    path: '/:userId/account',
    name: 'accountcenter',
    component: AccountCenter,
    props: true,
  },
  {
    path: '/allstudygroups',
    name: 'studyGroupList',
    component: StudyGroupList,
    meta: { background: 'darker' }
  },
  {
    path: '/allfeeds',
    name: 'allFeeds',
    component: () => import('@/components/Feed/FeedList.vue'),
    meta: { background: 'darker' }
  },
  {
    path: '/feed/:feedId',
    name: 'feedDetail',
    component: () => import('@/components/Feed/FeedDetail.vue'),
    props: true,
  },
  {
    path: '/createstudygroup',
    name: 'createStudyGroup',
    component: CreateStudyGroup,
  },
  {
    path: '/studygroup/:groupId',
    name: 'studyGroupPage',
    component: StudyGroupPage,
    props: true,
    children: [
      {
        path: 'studyGroupSpace',
        name: 'studyGroupSpace',
        component: StudyGroupPage,
        props: (route) => ({ groupId: route.params.groupId }),
      },
      {
        path: 'managePanel',
        name: 'managePanel',
        component: StudyGroupPage,
        props: (route) => ({ groupId: route.params.groupId }),
      },
    ],
  },
  // {
  //   path: '/group/:groupId/manage',
  //   name: 'managePanel',
  //   component: ManagePanel,
  //   props: true
  // },
  // {
  //   path: '/studygroup/:groupId/space',
  //   name: 'studyGroupSpace',
  //   component: StudyGroupSpace,
  //   props: true, // Enables the route parameter to be passed as a prop to the component
  // },
  {
    path: '/support',
    name: 'support',
    component: SponsorShip,
  },
  {
    path: '/about',
    name: '/about',
    component: AboutUs,
  },
  {
    path: '/contact',
    name: '/contact',
    component: ContactUs,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  store.commit('resetSelectedNodes') // commit the mutation
  next() // proceed to the next route
})

export default router
