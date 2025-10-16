import { createRouter, createWebHistory } from 'vue-router'
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import HomeView from '../views/HomeView.vue'
import MainLayout from "@/layouts/MainLayout.vue";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import AddProduct from "@/components/AddProduct.vue";
import ProductList from "@/components/ProductList.vue";
import Checkout from "@/components/Checkout.vue";
import Sales from '@/components/Sales.vue';
import Vendors from "@/views/Vendors.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "Login", component: Login },
    { path: "/register", name: "Register", component: Register }, // 👈 新增註冊頁
    {
      path: "/",
      component: MainLayout,
      children: [
        { path: "", name: "Home", component: HomeView },
        { path: "add", component: AddProduct },
        { path: "products", name: "Products", component: ProductList },
        { path: "checkout", name: "Checkout", component: Checkout },
        { path: "sales", name: "Sales", component: Sales },
        { path: "vendors", name: "Vendors", component: Vendors },
      ],
      meta: { requiresAuth: true },
    },
  ],
})

// 🔒 路由守衛
// router.beforeEach((to, from, next) => {
//   const user = auth.currentUser;
//   console.log("當前用戶:", user);
//   if (to.meta.requiresAuth && !user) {
//     // 需要登入但沒登入 → 導到 login
//     console.log("路由守衛: 需要登入");
//     next("/login");
//   } else if ((to.path === "/login" || to.path === "/register") && user) {
//     // 已登入，阻止訪問登入或註冊頁
//     console.log("路由守衛: 已登入，阻止訪問登入或註冊頁");
//     next("/");
//   } else {
//     console.log("路由守衛: 放行");
//     next();
//   }
// });

router.beforeEach((to, from, next) => {
  // 訂閱一次 Firebase Auth 狀態
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (to.meta.requiresAuth && !user) {
      console.log("路由守衛: 需要登入");
      next("/login");
    } else if ((to.path === "/login" || to.path === "/register") && user) {
      console.log("路由守衛: 已登入，阻止訪問登入或註冊頁");
      next("/");
    } else {
      console.log("路由守衛: 放行");
      next();
    }

    unsubscribe(); // 立即取消訂閱，避免重複觸發
  });
});
export default router
