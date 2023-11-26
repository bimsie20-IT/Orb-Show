import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import Start from '../views/Start.vue'

const router = createRouter({
    /*
    ! Voor de developement server gebruiken we web-history, !
    ! maar voor electron gebruiken we web-hash-history       !
    */
    history: electronAPI.devMode() ? createWebHistory(import.meta.env.BASE_URL) : createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'start',
            component: Start
        },
        {
            path: '/edit/:inhoud/:refreshRate',
            name: 'edit',
            component: () => import('../views/edit/Edit.vue'),
            props: true
        }
    ]
})

export default router
