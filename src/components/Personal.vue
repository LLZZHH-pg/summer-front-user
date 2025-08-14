<template>
  <div class="d-flex h-100">
    <!-- 左侧导航 -->
    <div class="nav flex-column nav-pills p-3 bg-light border-end" >
      <button class="nav-link" :class="{ active: tab === 'home' }"
              @click="tab = 'home'" style="width: 110px !important;">个人主页</button>
      <button class="nav-link" :class="{ active: tab === 'write' }"
              @click="openWrite">写心记</button>
      <button class="nav-link" :class="{ active: tab === 'square' }"
              @click="tab = 'square'">广场</button>
    </div>

    <div class="flex-fill p-3 overflow-auto">
      <!-- 个人主页 -->
      <div v-if="tab === 'home'">
        <div v-if="!contents || contents.length === 0" class="text-center text-muted mt-5">
          <h4>点击"写心记"开始记录</h4>
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
            <!-- 修改这里：使用只读编辑器展示内容 -->
            <div class="card-body readonly-editor-container" style="min-height: 300px;">
              <Editor
                :model-value="c.content"
                :defaultConfig="readOnlyEditorConfig"
                mode="simple"
                class="readonly-editor"
              />
            </div>
            <div class="card-footer d-flex flex-column align-items-center">
              <div class="d-flex flex-row justify-content-end align-items-center">
                <div class="input-group d-flex me-2" style="height: 2.5rem;">
                  <input type="text" class="form-control"v-model="singleComment[c.contentId]" placeholder="请输入评论(少于500字)" aria-label="Example text with button addon" aria-describedby="button-addon1">
                  <button class="btn btn-warning text-white" type="button" id="comment" @click="comment(c.contentId,singleComment[c.contentId])">发布</button>
                </div>
                <div class="form-check d-flex flex-row align-items-center p-0 mb-0">
                  <input 
                    class="btn-check" 
                    type="checkbox" 
                    autocomplete="off"
                    :id="'like-' + c.contentId"
                    :checked="c.isLiked"
                    @change="like(c.contentId,$event.target.checked)"
                  >
                  <label class="btn btn-success" style="width: 4rem;height: 2.5rem;" :for="'like-' + c.contentId">点赞 </label>
                  <span class="badge bg-primary rounded-2 ms-2 d-flex justify-content-center align-items-center" style="width: 4rem;height: 2.5rem;">{{ c.likes || 0 }}</span>
                </div>
              </div>
              <div v-if="c.comments && c.comments.length > 0" class="mt-3">
                <!-- <h6 class="text-muted mb-2">评论 ({{ c.comments.length }})</h6> -->
                <div v-for="comment in c.comments" :key="comment.commentId" class="border-bottom pb-2 mb-2">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <small class="text-muted">用户ID: {{ comment.userId }}</small>
                      <div class="mt-1">{{ comment.commentText }}</div>
                    </div>
                    <small class="text-muted">{{ formatTime(comment.createTime) }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
            <div class="text-center"><button class="btn btn-outline-secondary" v-if="hasMore" @click="loadMore">加载更多</button></div>
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
          style="height:85vh;min-height: 300px;border:1px solid #ccc"
          v-model="html"
          :defaultConfig="editorConfig"
          mode="default"
          @onCreated="handleCreated"
        />
      </div>

      <!-- 广场 -->
      <div v-if="tab === 'square'">
        <Square/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { ElMessage } from 'element-plus'
import { getContents, saveContent, updateState as apiUpdateState, deleteContent ,likeContent,commentContent} from '@/api/content'
import { uploadImage} from '@/api/upload'
import Square from './Square.vue'

/* ---------------- 响应式变量 ---------------- */
const tab = ref('home')
const contents = ref([])
const editorRef = ref(null)   // 编辑器实例
const html = ref('')          // 编辑器内容
const editingId = ref(null)   // 正在编辑的文章 contentId
const uploadedImages = ref([]) // 存储本次编辑会话上传的图片
const singleComment = ref({})

const page = ref(1);
const pageSize = 10;
const hasMore = ref(true)
const loading = ref(false)

/* ---------------- 编辑器配置 ---------------- */
const toolbarConfig = {excludeKeys: ['group-video']}
const editorConfig = {
  placeholder: '在这里书写...(文字少于2000字，图片少于9张)',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          if (editorRef.value.getElemsByType('image').length >= 9) {
            ElMessage.warning('图片不能超过9张')
            return
          }
          const res = await uploadImage(file)
          const imageUrl = res.data
          uploadedImages.value.push(imageUrl)
          insertFn(res.data, '上传的图片', '')  // 只传递URL字符串
        } catch {
          ElMessage.error('图片上传失败')
        }
      }
    }
  },
}

// 只读编辑器配置
const readOnlyEditorConfig = {
  readOnly: true,  // 设置为只读模式
  autoFocus: false,  // 禁止自动聚焦
  scroll: false,  // 禁止滚动
  placeholder: '',  // 无占位符
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  loadContents()
})

/* ---------------- 方法 ---------------- */
function handleCreated(editor) {
  editorRef.value = editor
  
  nextTick(() => {
    // 设置编辑器容器样式
    const editorDom = editorRef.value.getEditableContainer()
    if (editorDom) {
      // editorDom.style.maxWidth = '85vw'
      editorDom.style.margin = '0 auto'
    }
    
    // 设置现有图片样式
    const images = editorDom.querySelectorAll('img')
    images.forEach(img => {
      // img.style.width = '10%'
      img.style.display = 'block'
      img.style.margin = '8px auto'
    })
    
    // 监听新图片插入事件
    // editorRef.value.on('inserted', (type, node) => {
    //   if (type === 'image') {
        
    //   }
    // })
  })
}

async function loadContents() {
  try {
    loading.value = true
    const res = await getContents(page.value, pageSize)
    // console.log('API响应:', res)
    if (page.value === 1) {
      contents.value = res.data || [];
    } else {
      contents.value = [...contents.value, ...res.data];
    }
      // contents.value = Array.isArray(res) ? res : res?.data || []
      hasMore.value = res.data.length >= pageSize
  } catch (e) {
    ElMessage.error('加载内容失败')
    contents.value = []
  }finally {
    loading.value = false
  }
}
function loadMore() {
  if (!loading.value) {
    page.value++;
    loadContents();
  }
}

function openWrite() {
  tab.value = 'write'
  editingId.value = null
  html.value = ''
  uploadedImages.value = []
}

async function save(state) {
  const text = editorRef.value.getText().trim()
  if (text.length > 2000) return ElMessage.warning('文字超过 2000 字')
  if (editorRef.value.getElemsByType('image').length >= 9) return ElMessage.warning('图片不能超过9张')

  try {
    const usedImages = extractImageUrls(html.value)
    await saveContent({
      contentId: editingId.value,
      content: html.value,
      state,
      uploadedImages: uploadedImages.value, // 本次上传的图片列表
      usedImages // 实际使用的图片列表
    })
    ElMessage.success(editingId.value ? '更新成功' : '发布成功')
    tab.value = 'home'
    page.value = 1
    loadContents()
    uploadedImages.value = [] // 清空上传记录
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || '保存失败')
  }
}
// ...existing code...
function extractImageUrls(htmlContent) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const images = doc.querySelectorAll('img')
  return Array.from(images).map(img => {
    const src = img.src
    // 查找/api的位置，只保留从/api开始的部分
    const apiIndex = src.indexOf('/api')
    return apiIndex !== -1 ? src.substring(apiIndex) : src
  })
}

function edit(item) {
  tab.value = 'write'
  editingId.value = item.contentId
  nextTick(() => {
    html.value = item.content
    uploadedImages.value = []
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
    page.value = 1
    loadContents()
  } catch {
    ElMessage.error('删除失败')
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleString('zh-CN')
}

async function like(contentId,check_isLiked) {
  try {
    await likeContent({contentId})
    // 在API调用成功后，直接更新本地数据
    const content = contents.value.find(c => c.contentId === contentId)
    if (content) {
      content.isLiked = check_isLiked
      if (check_isLiked) {
        content.likes = (content.likes || 0) + 1
      } else {
        content.likes = Math.max((content.likes || 0) - 1, 0)
      }
    }
    if(check_isLiked){
      ElMessage.success('点赞成功')
    }
    else{
      ElMessage.success('取消成功')
    }
  } catch (e) {
    ElMessage.error('点赞失败')
  }
}
async function comment(contentId,commentText){
  if(commentText.length>520) return ElMessage.warning('评论内容过长，少于500字')
  try{
    await commentContent({contentId,commentText})
    ElMessage.success('评论成功')
    singleComment.value[contentId] = '' // 清空输入框
  }catch(e){
    ElMessage.error('评论失败')
  }
}
</script>