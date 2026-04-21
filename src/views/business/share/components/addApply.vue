<template>
  <div class="body">
    <!-- 标题 -->
    <div class="title">
      <span>创建文件分享表单</span>
      <a-button class="backBtn" type="primary" @click="backPage">返回</a-button>
    </div>
    <!-- 新增表单 -->
    <div class="formBox">
      <el-form ref="addForm" :model="formState" label-width="auto" style="max-width: 600px" :rules="rules">
        <el-form-item label="文件类别" prop="fileType">
          <a-space>
            <a-select ref="selectFile" v-model:value="formState.fileType" style="width: 280px" :options="optionsFile"
              @change="chageFileType"></a-select>
          </a-space>
        </el-form-item>
        <el-form-item label="客户姓名" prop="customerName">
          <el-input style="width: 280px;" v-model="formState.customerName" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="客户邮箱" prop="customerEmail">
          <el-input style="width: 280px;" v-model="formState.customerEmail" placeholder="请输入客户邮箱" />
        </el-form-item>
        <el-form-item label="文件选择" prop="file" style="margin: 0 0 0 0;">
          <el-input class="upInput" style="width: 280px;" v-model="formState.filename" :readonly="true"
            placeholder="请选择上传文件">
            <template #suffix>
              <a-upload v-model:file-list="fileList" name="file" :showUploadList=false :multiple=true
                :before-upload="beforeUpload" :maxCount="1">
                <a-button type="primary" style="color: white;">
                  上传
                </a-button>
              </a-upload>
            </template>
          </el-input>
          <div style="color: gray; font-size: 12px;">
            *文件支持图片、音频、Office365文档、pdf、视频;不支持压缩包方式
          </div>
        </el-form-item>
        <el-form-item label="申请原因" prop="reason">
          <el-input type="textarea" class="reason-textarea" v-model="formState.reason" placeholder="请输入申请原因，最大输入文字数为100"
            maxlength="100" />
        </el-form-item>
        <el-form-item v-if="showManagerEmail == true" label="审批邮箱" prop="managerEmail">
          <el-input style="width: 280px;" v-model="formState.managerEmail" placeholder="请输入审批邮箱" />
          <div style="color: gray; font-size: 12px;">
            *因未找到上级人员，请手动输入上级审批人邮箱地址
          </div>
        </el-form-item>
      </el-form>
      <div class="btnBox">
        <a-button class="resetBtn" type="primary" @click="reset()">重置</a-button>
        <a-button class="subBtn" type="primary" @click="submit()" :loading="btnLoading">提交</a-button>
      </div>
    </div>
    <!-- 弹窗 -->
    <a-modal class="model" v-model:open="open" title="须知" :footer="null" :maskClosable="false">
      <ul class="ulContent">
        <li>请遵守公司政策 <a @click.stop="jumpPolicy(1)"> &lt; Acceptable Use of Tech Resources Policy(v11) &gt;</a> 和 <a
            @click.stop="jumpPolicy(2)">Acceptable Use of Tech Rescurces Procedure (v12)</a> </li>
        <li>你也可以使用公司已批准的文件分享方式<br> <a @click.stop="jumpPolicy(3)"> &lt;Tech - Sharing Files with External Partners: Best
            Practices and Tips &gt;</a> </li>
        <li>请确保您的文件不包含CSI,Confidential,Pll以及公司不允许外传的内容，确保您上传的文档是符合公司政策要求并经过批准的。遵守公司信息保护政策<br><a
            @click.stop="jumpPolicy(4)">Protection of Haleon Information Procedure (v9.0)</a> 和 <br> <a
            @click.stop="jumpPolicy(5)">Protection of Haleon Information Policy (v9.0)</a></li>
      </ul>
      <div class="modelBottom">
        <a-button class="modelBtn" type="primary" @click="handleOk">已知晓</a-button>
      </div>
    </a-modal>

    <!-- 权限提示弹窗 -->
    <a-modal v-model:open="authorityModal" title="提醒" :footer="null" :maskClosable="false" width="400px">
      <ul class="ulContent1">
        <li>请通过Service now提ticket申请使用权限</li>
        <li>Ticketname：WeCom File Transfer 系统使用 </li>
      </ul>
      <div class="modelBottom">
        <a-button type="primary" @click="authorityModal = false">确认</a-button>
      </div>
    </a-modal>

  </div>
</template>

<script setup>
import { reactive, ref, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { shareApi } from '/@/api/business/share/share-api.js'
import { message } from 'ant-design-vue';
import { useUserStore } from '/@/store/modules/system/user.js';

import { noticeApi } from '/@/api/business/oa/notice-api';
//路由
const router = useRouter()
const route = useRoute()
//vue3变量------------------------------
// 允许的文件类型白名单
const ALLOWED_TYPES = [
  // 图片 
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // 音频 
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  // Office文档
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // PDF
  'application/pdf',
  // 视频
  'video/mp4', 'video/mpeg', 'video/ogg', 'video/webm',
  'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  'video/3gpp', 'video/3gpp2', 'video/x-flv', 'video/avi'
];

// 禁止的类型（视频/压缩包）
const BANNED_TYPES = [
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];
// 控制是否显示审批邮箱以及审批邮箱的值
let showManagerEmail = ref(false)
// 上传按钮绑定文件变量
const fileList = ref([]);
// 按钮的上传中状态
let btnLoading = ref(false)
// 标记用户是否已选择文件
let hasSelectedFile = ref(false)
// 标记是否有分片正在上传
let isUploadingChunks = ref(false)
// 用于取消上传的 AbortController
let uploadAbortController = null
// 表单变量
const addForm = ref()
let formState = ref({
  fileType: '0',
  customerName: '',
  customerEmail: '',
  file: '',
  reason: '',
  filename: '',
  managerEmail: ''
});

const isAuthority = ref(0);

const rules = reactive({
  fileType: [{ required: true, message: '请选择文件类别', trigger: 'blur' },],
  customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' },],
  reason: [{ required: true, message: '请输入申请原因', trigger: 'blur' },],
  customerEmail: [{ required: true, message: '请输入客户邮箱', trigger: 'blur' },],
  file: [{ required: true, message: '请上传文件', trigger: 'blur' },],
  managerEmail: [
    // { required: true, message: '请输入审批邮箱', trigger: 'blur' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
})
const optionsFile = ref([
  // {
  //   value: '',
  //   label: '全部',
  //   select:true
  // },
  {
    value: '0',
    label: '公共[Public]',
  },
  {
    value: '1',
    label: '内部用户[Internal Use]',
  },
  {
    value: '2',
    label: '机密[Confidential]',
  },
  {
    value: '3',
    label: 'CSI[Critical and Sensitive Information]',
  },
]);
// 控制弹框提示
const open = ref(true);
// 控制权限提示弹窗
const authorityModal = ref(false);
//vue3方法-------------------------

// 返回按钮
const backPage = () => {
  // 如果有分片正在上传，取消上传
  if (isUploadingChunks.value && uploadAbortController) {
    uploadAbortController.abort()
    uploadAbortController = null
    isUploadingChunks.value = false
    formState.value.filename = ''
    hasSelectedFile.value = false
  }
  router.push("/share/list")
}
const chageFileType = (value) => {
  formState.fileType = value
}
// 提交按钮
const submit = () => {
  addForm.value.validate((vaild, m) => {
    if (vaild) {
      btnLoading.value = true;
      if (isAuthority.value == 0) {
        btnLoading.value = false;
        authorityModal.value = true;
        return
      }
      shareApi.add(formState.value).then((res) => {
        btnLoading.value = false
        reset()
        message.success('成功')
        router.push({
          path: "/share/list",
        })
      }).catch((error) => {
        console.log(error)
        btnLoading.value = false
        // 统一显示文件名称不合规的错误提示
        if (error.message == "Network Error") {
          message.error("文件名称不合规")
        }
      })
    } else if (m.file && m.file[0].message == '请上传文件') {
      message.error('上传文件不能为空')
    }
  })
}
// 重置按钮
const reset = () => {
  // 如果有分片正在上传，取消上传
  if (isUploadingChunks.value && uploadAbortController) {
    uploadAbortController.abort()
    uploadAbortController = null
    isUploadingChunks.value = false
  }

  addForm.value.resetFields()
  formState.value.file = null
  formState.value.filename = null
  hasSelectedFile.value = false
}

const selectFileName = ref('')
// 上传文件
const beforeUpload = (file) => {
  // 标记用户已选择文件
  hasSelectedFile.value = true

  // 1. 检查禁止类型
  const isBanned = BANNED_TYPES.some(type => file.type.includes(type));
  if (isBanned) {
    message.error('不支持压缩包文件！');
    return false; // 阻止上传 
  }

  // 2. 检查允许类型
  console.log(file.type)
  const isAllowed = ALLOWED_TYPES.includes(file.type);
  if (!isAllowed && !file.type.startsWith('video/')) {
    message.error(` 仅支持图片、音频、Office文档、PDF和视频格式！`);
    return false;
  }

  // 3. 检查文件大小 (1GB = 1024 * 1024 * 1024 bytes)
  const maxSize = 1024 * 1024 * 1024; // 1GB
  if (file.size > maxSize) {
    message.error('文件大小不能超过1GB！');
    return false;
  }

  // 4. 校验通过后处理 
  fileList.value = [file]; // 更新文件列表
  formState.value.filename = "上传中....";  // 同步到表单字段
  selectFileName.value = file.name

  // 分块上传
  const chunkSize = 5 * 1024 * 1024; // 5MB 分块大小
  const totalChunks = Math.ceil(file.size / chunkSize);
  let fileKey = '';
  const uploadStartTime = Date.now(); // 记录上传开始时间
  console.log(`开始上传文件: ${file.name}, 文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB, 分片数量: ${totalChunks}`);
  // 标记开始上传分片
  isUploadingChunks.value = true;
  // 初始化 AbortController 用于取消上传
  uploadAbortController = new AbortController();

  // 1. 初始化上传会话
  shareApi.initUpload({
    fileName: file.name,
    fileSize: file.size,
    applyUid: '' // 暂时为空，后续可根据需要传递
  })
    .then((initRes) => {
      console.log('初始化上传会话返回', initRes);
      fileKey = initRes.data?.fileKey;
      if (!fileKey) {
        throw new Error('初始化上传会话失败：未获取到 fileKey');
      }

      // 2. 上传分块（滑动窗口并发控制）
      const uploadChunks = async () => {
        const concurrency = 10; // 并发数
        const executing = [];
        let completedCount = 0;

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('containerName', 'shareupload');
          formData.append('fileKey', fileKey);
          formData.append('chunkIndex', i);
          formData.append('chunkData', chunk);

          const promise = shareApi.uploadChunk(formData, { signal: uploadAbortController.signal })
            .then(() => {
              completedCount++;
              console.log(`分块 ${i + 1}/${totalChunks} 上传成功 (${completedCount}/${totalChunks})`);
              // 从executing数组中移除已完成的promise
              const index = executing.indexOf(promise);
              if (index > -1) {
                executing.splice(index, 1);
              }
            })
            .catch((chunkErr) => {
              console.error(`分块 ${i + 1}/${totalChunks} 上传失败：`, chunkErr);
              if (chunkErr.name == "CanceledError") {
                throw new Error(`文件上传已取消`);
              } else {
                throw new Error(`分块上传失败：${chunkErr.data?.msg || '未知错误'}`);
              }
            });

          executing.push(promise);

          // 当达到并发上限时，等待其中一个完成
          if (executing.length >= concurrency) {
            await Promise.race(executing);
          }
        }

        // 等待剩余的请求完成
        await Promise.all(executing);
        console.log(`所有分片上传完成，共 ${totalChunks} 个分片`);
      };

      return uploadChunks();
    })
    .then(() => {
      // 确认所有分片上传完成后，调用完成上传接口
      const uploadEndTime = Date.now(); // 记录上传结束时间
      const uploadDuration = ((uploadEndTime - uploadStartTime) / 1000).toFixed(2); // 计算上传耗时（秒）
      console.log('所有分片已上传完成，开始调用完成上传接口...');
      console.log(`上传耗时: ${uploadDuration}秒`);

      // 3. 完成上传
      return shareApi.completeUpload({
        containerName: 'shareupload',
        fileKey: fileKey,
        fileName: file.name,
        totalChunks: totalChunks,
        applyUid: '' // 暂时为空，后续可根据需要传递
      });
    })
    .then((completeRes) => {
      console.log('完成上传返回', completeRes);
      let uploadFile = {
        "documentName": completeRes.name || completeRes.file?.name || file.name,
        "documentKey": fileKey,
        "documentUrl": completeRes.url || '',
        "fileSize": completeRes.fileSize || completeRes.file?.size || file.size,
        "fileCategory": formState.value.fileType
      };
      formState.value.file = uploadFile;
      formState.value.filename = completeRes.name || completeRes.file?.name || file.name;
      message.success('文件上传成功');
    })
    .catch((err) => {
      message.error(err.message || '文件上传失败');
      console.error('上传错误：', err);
      formState.value.filename = '';
    });

  return false; // 返回false以阻止自动上传 
};
// 弹框提示控制
const handleOk = e => {
  open.value = false;
};

// 弹窗中点击公司政策跳转地址
const jumpPolicy = (value) => {
  if (value == 1) {
    window.open('https://protect.checkpoint.com/v2/r01/___https://gskch-qualitysuite.veevavault.com/ui/%23doc_info/5029179/11/0___.YzJ1OnF1ZXN0Z2xvYmFsOmM6bzo0Yjc4N2ZjNWRjNjYyODZjOWYwMjQ4ZjRjMGM3N2JjMDo3OmY1ZWI6OWU3MjAzOGVkNmMzYjRkOTZiZGQ2ZjZiZmQ1NTEwNzhhMDk1YWZmOGQ4YzdlZDE0YWQ5YTU4MDA2NWI4YjhhYzpoOlQ6Tg', '_blank', 'noopener,noreferrer');
  }
  else if (value == 2) {
    window.open('https://protect.checkpoint.com/v2/r01/___https://gskch-qualitysuite.veevavault.com/ui/%23doc_info/5029114___.YzJ1OnF1ZXN0Z2xvYmFsOmM6bzo0Yjc4N2ZjNWRjNjYyODZjOWYwMjQ4ZjRjMGM3N2JjMDo3OmNhNmY6NjJmYmY4NjQzNzkxZjVkNTFlZjMzOTg4ZjNmMmFkM2Q5M2M2NmMxNjZmN2M1ZWQ0ODA1MDhlMDliNDA2YWU5OTpoOlQ6Tg', '_blank', 'noopener,noreferrer');
  }
  else if (value == 3) {
    window.open('https://protect.checkpoint.com/v2/r01/___https://gskch-qualitysuite.veevavault.com/ui/%23doc_info/5029114___.YzJ1OnF1ZXN0Z2xvYmFsOmM6bzo0Yjc4N2ZjNWRjNjYyODZjOWYwMjQ4ZjRjMGM3N2JjMDo3OmNhNmY6NjJmYmY4NjQzNzkxZjVkNTFlZjMzOTg4ZjNmMmFkM2Q5M2M2NmMxNjZmN2M1ZWQ0ODA1MDhlMDliNDA2YWU5OTpoOlQ6Tg', '_blank', 'noopener,noreferrer');
  }
  else if (value == 4) {
    window.open('https://protect.checkpoint.com/v2/r01/___https://gskch-qualitysuite.veevavault.com/ui/___.YzJ1OnF1ZXN0Z2xvYmFsOmM6bzo0Yjc4N2ZjNWRjNjYyODZjOWYwMjQ4ZjRjMGM3N2JjMDo3OmUxZDE6YTk3ZGU2M2U1N2JmZDQ0OGU5MDgwYzAyMDZmMmQ0NDVjYjQ2MGQwOGQ5NTJhOTI5YjQ5OWM5OTIxYmJlNzgxNDpoOlQ6Tg', '_blank', 'noopener,noreferrer');
  }
  else if (value == 5) {
    window.open('https://protect.checkpoint.com/v2/r01/___https://gskch-qualitysuite.veevavault.com/ui/___.YzJ1OnF1ZXN0Z2xvYmFsOmM6bzo0Yjc4N2ZjNWRjNjYyODZjOWYwMjQ4ZjRjMGM3N2JjMDo3Ojk5N2Q6OWViZDI4YjNkYzBkOGQ3Y2NhN2UxOGI3ZmRhODU2ZWJiNzIzNzY4MDFiMGJiYzQ5Nzc1YzE0OTRkYTNlNjFlMTpoOlQ6Tg', '_blank', 'noopener,noreferrer');
  }
}
// 页面刷新/离开提示
const handleBeforeUnload = (e) => {
  if (hasSelectedFile.value) {
    const fileName = selectFileName.value || '未上传文件'
    const reason = '页面刷新/离开'
    const applyUid = '1'

    // 调用日志接口记录页面刷新或离开
    shareApi.log({
      fileName,
      reason,
      applyUid
    }).then(() => {
      console.log('页面刷新/离开日志已记录')
    }).catch((err) => {
      console.error('记录页面刷新/离开日志失败：', err)
    })
  }
}

// 缓存键名
const OFFLINE_LOGS_KEY = 'share_offline_logs'

// 保存日志到缓存
const saveLogToCache = (fileName, reason, applyUid) => {
  try {
    const cachedLogs = JSON.parse(localStorage.getItem(OFFLINE_LOGS_KEY) || '[]')
    cachedLogs.push({
      fileName,
      reason,
      applyUid,
      timestamp: Date.now()
    })
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(cachedLogs))
    console.log('日志已保存到缓存，待网络恢复后上传')
  } catch (err) {
    console.error('保存日志到缓存失败：', err)
  }
}

// 从缓存中读取并上传日志
const uploadCachedLogs = () => {
  try {
    const cachedLogs = JSON.parse(localStorage.getItem(OFFLINE_LOGS_KEY) || '[]')

    if (cachedLogs.length === 0) {
      return
    }

    console.log(`发现 ${cachedLogs.length} 条缓存日志，开始上传...`)

    // 逐条上传日志
    const uploadPromises = cachedLogs.map(log =>
      shareApi.log({
        fileName: log.fileName,
        reason: log.reason,
        applyUid: log.applyUid
      }).then(() => {
        console.log(`日志上传成功：${log.fileName} - ${log.reason}`)
      }).catch((err) => {
        console.error(`日志上传失败：${log.fileName} - ${log.reason}`, err)
      })
    )

    // 等待所有上传完成
    Promise.all(uploadPromises).then(() => {
      // 上传完成后清除缓存
      localStorage.removeItem(OFFLINE_LOGS_KEY)
      console.log('所有缓存日志已上传并清除')
    })
  } catch (err) {
    console.error('读取缓存日志失败：', err)
  }
}

// 网络状态变化处理
const handleOnline = () => {
  message.success('网络已恢复连接')
  // 网络恢复后，上传缓存的日志
  uploadCachedLogs()
}

const handleOffline = () => {
  message.warning('网络连接已断开，请检查您的网络设置')

  // 只有当用户已选择文件时才保存日志到缓存
  if (hasSelectedFile.value) {
    const fileName = selectFileName.value || '未上传文件'
    const reason = '网络断开'
    const applyUid = '1'

    // 保存到缓存而不是直接调用接口
    saveLogToCache(fileName, reason, applyUid)
  }
}

//vue3生命周期
onBeforeMount(() => {
  queryNoticeList();


  shareApi.checkManager().then((res) => {
    if (res.data == '1') {
      showManagerEmail.value = false
    } else if (res.data == '-1') {
      showManagerEmail.value = true
    } else {
      showManagerEmail.value = true
      formState.value.managerEmail = res.data
    }
  })
})

async function queryNoticeList() {
  const resu = useUserStore().$state;
  console.log(resu)
  try {
    const result = await noticeApi.queryEmployeeNotice1({
      employeeId: resu.employeeId,
      pageNum: 1,
      pageSize: 6
    });
    isAuthority.value = result?.data?.list[0]?.isAuthority
  } catch (err) {
    isAuthority.value = 0
  }
}

onMounted(() => {
  // 添加页面刷新/离开监听
  window.addEventListener('beforeunload', handleBeforeUnload)

  // 添加网络状态监听
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // 初始检查网络状态
  if (!navigator.onLine) {
    message.warning('网络连接不可用，请检查您的网络设置')
  }
})
onBeforeUpdate(() => {

})
onUpdated(() => {
  console.log('页面刷新')
})
onBeforeUnmount(() => {
  console.log(hasSelectedFile.value)
  // 如果有分片正在上传，取消上传
  if (isUploadingChunks.value && uploadAbortController) {
    uploadAbortController.abort()
    uploadAbortController = null
  }
  // 页面刷新或离开时记录日志
  if (hasSelectedFile.value) {
    const fileName = selectFileName.value || '未上传文件'
    const reason = '页面刷新/离开'
    const applyUid = '1'

    // 调用日志接口记录页面刷新或离开
    shareApi.log({
      fileName,
      reason,
      applyUid
    }).then(() => {
      console.log('页面刷新/离开日志已记录')
    }).catch((err) => {
      console.error('记录页面刷新/离开日志失败：', err)
    })
  }
})
onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped lang="scss">
ul {
  list-style: none;
}

.body {
  background-color: white;
  height: 87vh;
  padding: 20px 15px 0 15px;

  .title {
    span {
      font-size: 16px;
      font-weight: bold;
      padding: 0 0 20px 0;
    }

    .backBtn {
      float: right;
      height: 30px;
      width: 60px;
    }
  }

  .formBox {
    margin: 20px 0 0 0;

    .upInput:deep(.el-input__wrapper) {
      padding-right: 0px;
    }

    .reason-textarea {
      width: 280px;

      :deep(.el-textarea__inner) {
        height: 100px;
        resize: none;
      }
    }

    .btnBox {
      width: 359px;
      display: flex;
      justify-content: space-around;

      .resetBtn {
        width: 90px;
        background-color: #A4ADB3;
      }

      .subBtn {
        width: 90px;
      }
    }
  }
}

.ulContent>li:before {
  content: "";
  width: 6px;
  height: 6px;
  display: inline-block;
  border-radius: 50%;
  background: #4F8EFF;
  vertical-align: middle;
  margin-right: 14px;
}

.modelBottom {
  width: 100%;
  text-align: center;
}
</style>