<template>
  <div class="d-flex h-100">
    <!-- 左侧导航 -->
    <div class="nav flex-column nav-pills p-3 bg-light border-end" style="width:180px">
      <button class="nav-link" :class="{ active: tab === 'home' }"
              @click="tab = 'home'">个人主页</button>
      <button class="nav-link" :class="{ active: tab === 'write' }"
              @click="openWrite">写心记</button>
    </div>

    <div class="flex-fill p-3 overflow-auto">
      <!-- 个人主页 -->
      <div v-if="tab === 'home'">
        <div v-if="!contents || contents.length === 0" class="text-center text-muted mt-5">
          <!-- <h4>您还没有任何心记</h4> -->
          <h4>点击“写心记”开始记录</h4>
        </div>
        <div v-else>
          <div v-for="c in contents" :key="c.contentId" class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span>{{ formatTime(c.createTime) }}</span>
              <div class="d-flex gap-2 align-items-center">
                <select class="form-select form-select-sm w-auto"
                        @change="updateState(c.contentId, $event.target.value)">
                  <option value="public" :selected="c.state==='public'">公开</option>
                  <option value="private" :selected="c.state==='private'">私密</option>
                  <option value="save" :selected="c.state==='save'">草稿</option>
                </select>
                <button v-if="c.state==='save'" class="btn btn-sm btn-warning"
                        @click="edit(c)">编辑</button>
                <button class="btn btn-sm btn-danger" @click="del(c.contentId)">删除</button>
              </div>
            </div>
            <div class="card-body">
              <div v-html="c.content"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 写心记 -->
      <div v-if="tab === 'write'">
        <div class="d-flex justify-content-end mb-2">
          <div class="btn-group">
            <button type="button" class="btn btn-primary dropdown-toggle"
                    data-bs-toggle="dropdown">发布</button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" @click="save('private')">私密查看</a></li>
              <li><a class="dropdown-item" href="#" @click="save('public')">公开到广场</a></li>
            </ul>
          </div> 
          <button type="button" class="btn btn-success ms-1" @click="save('save')">保存</button>
          
        </div>

        <!-- 编辑器 -->
        <Toolbar
          style="border:1px solid #ccc"
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          mode="default"
        />
        <Editor
          style="height:75vh;border:1px solid #ccc"
          v-model="html"
          :defaultConfig="editorConfig"
          mode="default"
          @onCreated="handleCreated"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { ElMessage } from 'element-plus'
import { getContents, saveContent, updateState as apiUpdateState, deleteContent } from '@/api/content'
import { uploadImage } from '@/api/upload'

/* ---------------- 响应式变量 ---------------- */
const tab = ref('home')
const contents = ref([])
const editorRef = ref(null)   // 编辑器实例
const html = ref('')          // 编辑器内容
const editingId = ref(null)   // 正在编辑的文章 contentId

/* ---------------- 编辑器配置 ---------------- */
const toolbarConfig = {excludeKeys: ['group-video']}
const editorConfig = {
  placeholder: '在这里书写...(文字少于2000字，图片少于10张)',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          const { data } = await uploadImage(file)
          insertFn(data.url)
        } catch {
          ElMessage.error('图片上传失败')
        }
      }
    }
  }
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  loadContents()
})

/* ---------------- 方法 ---------------- */
function handleCreated(editor) {
  editorRef.value = editor           // 保存实例
}

async function loadContents() {
  try {
    const res = await getContents()
    contents.value = Array.isArray(res) ? res : res?.data || []
  } catch (e) {
    ElMessage.error('加载内容失败')
    contents.value = []
  }
}

function openWrite() {
  tab.value = 'write'
  editingId.value = null
  html.value = ''
}

async function save(state) {
  const text = editorRef.value.getText().trim()
  if (text.length > 2000) return ElMessage.warning('文字超过 2000 字')
  if (editorRef.value.getElemsByType('image').length > 10) return ElMessage.warning('图片超过 10 张')

  try {
    await saveContent({ contentId: editingId.value, content: html.value, state })
    ElMessage.success(editingId.value ? '更新成功' : '发布成功')
    tab.value = 'home'
    loadContents()
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '保存失败')
  }
}

function edit(item) {
  tab.value = 'write'
  editingId.value = item.contentId
  nextTick(() => {
    html.value = item.content
  })
}

async function updateState(contentId, state) {
  try {
    await apiUpdateState({contentId, state })
    ElMessage.success('状态已更新')
    loadContents()
  } catch {
    ElMessage.error('更新失败')
  }
}

async function del(contentId) {
  if (!confirm('确定删除这条内容吗？')) return
  try {
    await deleteContent({contentId})
    ElMessage.success('删除成功')
    loadContents()
  } catch {
    ElMessage.error('删除失败')
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleString('zh-CN')
}
</script>