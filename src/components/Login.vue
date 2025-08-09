<template>
  <div class="container-fluid d-flex align-items-center" style="height:100vh">
    <div class="container d-flex flex-column">
      <div class="row">
        <div class="col-5"></div>
        <div class="col-2"><h1 class="text-center">登录</h1></div>
        <div class="col-5"></div>
      </div>

      <div class="row">
        <div class="col-4"></div>
        <div class="col-4">
          <form @submit.prevent="handleLogin" class="d-flex flex-column align-items-center">
            <div class="input-group mb-3">
              <span class="input-group-text justify-content-center" style="width:4em;">账号</span>
              <input type="text" class="form-control" placeholder="电话号码/邮箱/用户名"
                     v-model.trim="form.account" required />
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text justify-content-center" style="width:4em;">密码</span>
              <input type="password" class="form-control" placeholder="输入密码"
                     v-model.trim="form.password" required />
            </div>
            <button type="submit" class="btn btn-primary">登录</button>
          </form>

          <div class="d-flex flex-column align-items-center mt-3">
            <button class="btn btn-outline-primary" @click="router.push('/register')">注册</button>
          </div>
        </div>
        <div class="col-4"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/auth'

const router = useRouter()
const form = reactive({
  account: '',
  password: ''
})

const handleLogin = async () => {
  try {
    await login(form);
    router.push('/personal');  // 拦截器已处理token和消息
  } catch (error) {
    // 拦截器已显示错误消息，这里可以不做额外处理
  }
}
</script>