<template>
  <div class="container-fluid d-flex align-items-center" style="height:100vh">
    <div class="container d-flex flex-column">
      <div class="row">
        <div class="col-5"></div>
        <div class="col-2"><h1 class="text-center">注册</h1></div>
        <div class="col-5"></div>
      </div>

      <div class="row">
        <div class="col-4"></div>
        <div class="col-4">
          <form @submit.prevent="handleRegister" class="d-flex flex-column align-items-center">
            <div class="input-group mb-3">
              <span class="input-group-text justify-content-center" style="width:6em;">邮箱账号</span>
              <input type="email" class="form-control" placeholder="邮箱账号" v-model.trim="form.email" required />
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text justify-content-center" style="width:6em;">电话号码</span>
              <input type="text" class="form-control" placeholder="电话号码" v-model.trim="form.tel" required />
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text justify-content-center" style="width:6em;">用户名</span>
              <input type="text" class="form-control" placeholder="用户名" v-model.trim="form.name" required />
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text justify-content-center" style="width:6em;">设置密码</span>
              <input type="password" class="form-control" placeholder="密码" v-model.trim="form.password" required />
            </div>
            <button type="submit" class="btn btn-primary">立即注册</button>
          </form>

          <div class="d-flex flex-column align-items-center mt-3">
            <button class="btn btn-outline-secondary" @click="$router.push('/login')">返回登录</button>
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
import { ElMessage } from 'element-plus'
import { register } from '@/api/auth'

const router = useRouter()
const form = reactive({
  email: '',
  tel: '',
  name: '',
  password: ''
})

const handleRegister = async () => {
  try {
    await register(form)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '注册失败')
  }
}
</script>