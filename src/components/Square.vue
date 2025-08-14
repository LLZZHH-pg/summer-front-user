<template>
  
    <div class="flex-fill overflow-auto">
      <!-- 个人主页 -->
        <div v-if="!contents || contents.length === 0" class="text-center text-muted mt-5">
          <h4>没东西哦</h4>
        </div>
        <div v-else>
          <div v-for="c in contents" :key="c.contentId" class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span>用户：{{ c.username || c.userId }}</span>
              <span>{{ formatTime(c.createTime) }}</span>
            </div>
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
                      <small class="text-muted">用户：{{ comment.username || comment.userId }}</small>
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
  
</template>

<script setup>
import { ref, onMounted} from 'vue'
import { Editor} from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { ElMessage } from 'element-plus'
import { getContentsSquare,likeContent,commentContent} from '@/api/square'

/* ---------------- 响应式变量 ---------------- */
const contents = ref([])
const singleComment = ref({})

const page = ref(1);
const pageSize = 10;
const hasMore = ref(true)
const loading = ref(false)



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


async function loadContents() {
  try {
    loading.value = true
    const res = await getContentsSquare(page.value, pageSize)
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
    singleComment.value = '' // 清空输入框
  }catch(e){
    ElMessage.error('评论失败')
  }
}
</script>