<template>
  <div class="collect-page">
    <div class="collect-box">
      <div class="left">
        <div class="dept">
          {{ allData.departmentName }}<span class="name">{{ allData.applyEmployeeName }}</span>
        </div>
        <div class="invite">邀请你上传{{ allData.fileNumber }}个文档</div>
      </div>
      <div class="right">
        <div class="upload-list">
          <div class="upload-row" v-for="(slot, idx) in slots" :key="idx">
            <div class="file-label">文件{{ idx + 1 }}：</div>
            <el-upload v-if="isCollectComplete == false" class="upload"
              :on-change="(file, fileList) => handleFileChange(file, fileList, idx)"
              :on-remove="(file) => removeFile(file, idx)" :file-list="slot.files" :auto-upload="false"
              :show-file-list="true" :limit="1">
              <el-button type="primary" :loading="slot.uploading"
                :disabled="slot.uploading || (slot.files && slot.files.length > 0)">
                {{ slot.uploading ? '上传中...' : '点击上传' }}
              </el-button>
            </el-upload>
            <span style="margin: 1px 0 0 0" v-if="isCollectComplete == true"> {{ hasCollectedFiles[idx].documentName
            }}</span>
          </div>
        </div>

        <div class="tips">
          <div>* 单个文件大小不超过 1G</div>
          <div>* 文件类型建议图片、音频、Office365文档、pdf、视频</div>
          <div class="ban">* 禁止上传 .exe、.bat、.zip、.RAR 等可执行类文件</div>
        </div>

        <div class="submit-row">
          <el-button v-if="isCollectComplete == false" type="primary" class="submit-btn" @click="submit">提交</el-button>
        </div>

        <div class="expire">* 该链接有效期至：{{ formatTimeByTimezone(allData.collectInvalidTime) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { loginApi } from '/@/api/system/login-api';
import { formatTimeByTimezone } from '/@/utils/time.js';
const allData = ref({});
const route = useRoute();
const router = useRouter();
const applyUid = ref(null);
const isSubmitting = ref(false);
const isCollectComplete = ref(false);
const hasCollectedFiles = ref([]);
// 标记是否有文件正在上传或已上传
const hasUploadingFiles = ref(false);
// 存储当前上传的文件名
const uploadingFileNames = ref([]);
// 三个上传槽，每项使用 Element Plus 的 file-list 管理
const slots = reactive([]);
// 用于存储每个槽位的 AbortController，用于取消上传
const uploadAbortControllers = ref([]);

// 缓存键名
const OFFLINE_LOGS_KEY = 'collect_offline_logs';

// 保存日志到缓存
const saveLogToCache = (fileName, reason, applyUidValue) => {
  try {
    const cachedLogs = JSON.parse(localStorage.getItem(OFFLINE_LOGS_KEY) || '[]');
    cachedLogs.push({
      fileName,
      reason,
      applyUid: applyUidValue,
      timestamp: Date.now(),
    });
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(cachedLogs));
    console.log('日志已保存到缓存，待网络恢复后上传');
  } catch (err) {
    console.error('保存日志到缓存失败：', err);
  }
};

// 从缓存中读取并上传日志
const uploadCachedLogs = () => {
  try {
    const cachedLogs = JSON.parse(localStorage.getItem(OFFLINE_LOGS_KEY) || '[]');

    if (cachedLogs.length === 0) {
      return;
    }

    console.log(`发现 ${cachedLogs.length} 条缓存日志，开始上传...`);

    // 逐条上传日志
    const uploadPromises = cachedLogs.map((log) =>
      loginApi
        .collectLog({
          fileName: log.fileName,
          reason: log.reason,
          applyUid: log.applyUid,
        })
        .then(() => {
          console.log(`日志上传成功：${log.fileName} - ${log.reason}`);
        })
        .catch((err) => {
          console.error(`日志上传失败：${log.fileName} - ${log.reason}`, err);
        })
    );

    // 等待所有上传完成
    Promise.all(uploadPromises).then(() => {
      // 上传完成后清除缓存
      localStorage.removeItem(OFFLINE_LOGS_KEY);
      console.log('所有缓存日志已上传并清除');
    });
  } catch (err) {
    console.error('读取缓存日志失败：', err);
  }
};

// 网络状态变化处理
const handleOnline = () => {
  ElMessage.success('网络已恢复连接');
  // 网络恢复后，上传缓存的日志
  uploadCachedLogs();
};

const handleOffline = () => {
  ElMessage.warning('网络连接已断开，请检查您的网络设置');

  // 只有当有文件正在上传或已上传时才保存日志到缓存
  if (hasUploadingFiles.value) {
    const fileNames = uploadingFileNames.value.length > 0 ? uploadingFileNames.value.join(', ') : '未上传文件';
    const reason = '网络断开';
    const applyUidValue = applyUid.value;

    // 保存到缓存而不是直接调用接口
    saveLogToCache(fileNames, reason, applyUidValue);
  }
};

// 页面刷新/离开提示
const handleBeforeUnload = (e) => {
  if (hasUploadingFiles.value) {
    const fileNames = uploadingFileNames.value.length > 0 ? uploadingFileNames.value.join(', ') : '未上传文件';
    const reason = '页面已刷新或离开';
    const applyUidValue = applyUid.value;

    // 调用日志接口记录页面刷新或离开
    loginApi
      .collectLog({
        fileName: fileNames,
        reason,
        applyUid: applyUidValue,
      })
      .then(() => {
        console.log('页面刷新/离开日志已记录');
      })
      .catch((err) => {
        console.error('记录页面刷新/离开日志失败：', err);
      });
  }
};


onMounted(() => {
  applyUid.value = route.query.applyUid;
  getDetail(route.query.applyUid);

  // 添加页面刷新/离开监听
  // window.addEventListener('beforeunload', handleBeforeUnload);

  // 添加网络状态监听
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 初始检查网络状态
  if (!navigator.onLine) {
    ElMessage.warning('网络连接不可用，请检查您的网络设置');
  }
});

onBeforeUnmount(() => {
  // 如果有分片正在上传，取消上传
  uploadAbortControllers.value.forEach((controller, idx) => {
    if (controller && slots[idx]?.uploading) {
      controller.abort();
      console.log(`槽位 ${idx} 的上传已取消`);
    }
  });
  uploadAbortControllers.value = [];

  // 页面刷新或离开时记录日志
  if (hasUploadingFiles.value) {
    const fileNames = uploadingFileNames.value.length > 0 ? uploadingFileNames.value.join(', ') : '未上传文件';
    const reason = '页面已刷新或离开';
    const applyUidValue = applyUid.value;

    // 调用日志接口记录页面刷新或离开
    loginApi
      .collectLog({
        fileName: fileNames,
        reason,
        applyUid: applyUidValue,
      })
      .then(() => {
        console.log('页面刷新/离开日志已记录');
      })
      .catch((err) => {
        console.error('记录页面刷新/离开日志失败：', err);
      });
  }
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});

function getDetail(applyUidValue) {
  loginApi.collectContent(applyUidValue).then((res) => {
    console.log('正在获取是否上传完整，展示' + JSON.stringify(res.data.collectComplete));
    allData.value = res.data;

    // 清空现有的 slots 数据，避免累加
    slots.length = 0;
    // 清空上传状态
    hasUploadingFiles.value = false;
    uploadingFileNames.value = [];

    if (res.data.collectComplete == 0) {
      // 修复：添加数组越界检查
      for (let i = 0; i < allData.value.fileNumber; i++) {
        if (i < res.data.files.length && res.data.files[i]) {
          slots.push({
            files: [
              {
                name: res.data.files[i]?.documentName,
                documentUid: res.data.files[i]?.documentUid,
                createTime: res.data.files[i]?.createTime,
                documentName: res.data.files[i]?.documentName,
              },
            ],
            uploading: false,
          });
        } else {
          slots.push({ files: [], uploading: false });
        }
      }

      // 检查是否有已上传的文件
      const hasFiles = slots.some((s) => s.files && s.files.length > 0);
      if (hasFiles) {
        hasUploadingFiles.value = true;
        uploadingFileNames.value = slots.filter((s) => s.files && s.files.length > 0).map((s) => s.files[0].name);
      }
    }
    if (res.data.collectComplete == 1) {
      // 修复：收集完成后需要初始化 slots 用于循环显示
      slots.length = allData.value.fileNumber;
      console.log('收集完成，初始化 slots:', slots);
      // for (let i = 0; i < allData.value.fileNumber; i++) {
      //   slots.push({ files: [], uploading: false })
      // }
      isCollectComplete.value = true;
      hasCollectedFiles.value = res.data.files;
      // 收集完成后清除上传状态
      hasUploadingFiles.value = false;
      uploadingFileNames.value = [];
    }
  });
}

function handleFileChange(file, fileList, idx) {
  console.log('文件变更：', file, 'fileList:', fileList, '槽位：', idx);

  if (!file || !file.raw) {
    return;
  }

  // 拦截：如果正在上传，直接返回
  if (slots[idx].uploading) {
    ElMessage.warning('文件正在上传中，请稍候...');
    return;
  }

  const fileObj = file.raw;
  const maxSize = 1024 * 1024 * 1024; // 1GB
  const name = fileObj.name || '';
  const lower = name.toLowerCase();
  const banned = [
    '.exe',
    '.bat',
    '.rar',
    '.zip',
    '.msi',
    '.sh',
    '.7z',
    '.cmd',
    '.ps1',
    '.vbs',
    '.js',
    '.jar',
    '.dll',
    '.so',
    '.dmg',
    '.pkg',
    '.deb',
    '.rpm',
    '.apk',
    '.app',
    '.bin',
    '.tar',
    '.gz',
    '.bz2',
    '.xz',
    '.zst',
    '.iso',
    '.img',
  ];
  for (const b of banned) {
    if (lower.endsWith(b)) {
      ElMessage.error('禁止上传可执行或压缩类文件');
      slots[idx].files = [];
      return;
    }
  }
  if (fileObj.size > maxSize) {
    ElMessage.error('文件大小不能超过 1G');
    slots[idx].files = [];
    return;
  }

  // 校验通过，进行分片上传
  slots[idx].uploading = true;
  // 标记有文件正在上传
  hasUploadingFiles.value = true;
  // 记录当前上传的文件名
  if (!uploadingFileNames.value.includes(fileObj.name)) {
    uploadingFileNames.value.push(fileObj.name);
  }

  // 初始化 AbortController 用于取消上传
  const abortController = new AbortController();
  uploadAbortControllers.value[idx] = abortController;

  // 分片配置：每个切片 5MB
  const CHUNK_SIZE = 5 * 1024 * 1024;
  const fileSize = fileObj.size;
  const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
  const uploadStartTime = Date.now(); // 记录上传开始时间

  console.log(`开始上传文件: ${fileObj.name}, 文件大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB, 分片数量: ${totalChunks}`);

  // 用于存储上传会话信息
  let containerName = 'collectionupload';
  let fileKey = '';

  // 步骤1：初始化上传会话
  loginApi
    .collectInitUpload(fileObj.name, fileSize, applyUid.value)
    .then((initRes) => {
      fileKey = initRes.data.fileKey;
      console.log('初始化上传会话成功:', { containerName, fileKey });

      // 步骤2：上传分片（滑动窗口并发控制）
      const uploadChunks = async () => {
        const concurrency = 5; // 并发数
        const executing = [];
        let completedCount = 0;

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, fileSize);
          const chunk = fileObj.slice(start, end);

          const promise = loginApi.collectUploadChunk(containerName, fileKey, i, chunk, { signal: abortController.signal })
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
                throw new Error(`分块上传失败：${chunkErr?.data?.msg || chunkErr?.msg || '未知错误'}`);
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

      // 执行分片上传
      return uploadChunks();
    })
    .then(() => {
      // 确认所有分片上传完成后，调用完成上传接口
      const uploadEndTime = Date.now(); // 记录上传结束时间
      const uploadDuration = ((uploadEndTime - uploadStartTime) / 1000).toFixed(2); // 计算上传耗时（秒）
      console.log('所有分片已上传完成，开始调用完成上传接口...');
      console.log(`上传耗时: ${uploadDuration}秒`);

      // 步骤3：完成上传，合并分片
      return loginApi.collectCompleteUpload(containerName, fileKey, fileObj.name, totalChunks, applyUid.value);
    })
    .then((completeRes) => {
      console.log('上传完成返回:', completeRes);
      const documentUid = completeRes.data?.documentUid;

      // 更新文件对象
      file.documentUid = documentUid;
      file.status = 'success';
      ElMessage.success(`文件${idx + 1}上传成功`);
      slots[idx].files = [file];

      // 检查是否还有其他文件正在上传
      const hasOtherUploading = slots.some((s) => s.uploading);
      if (!hasOtherUploading) {
        hasUploadingFiles.value = false;
        uploadingFileNames.value = [];
      }
    })
    .catch((err) => {
      // 修复：添加安全检查，防止 err.data.msg 不存在时报错
      const errorMsg = err?.data?.msg || err?.msg || `文件${idx + 1}上传失败`;
      ElMessage.error(errorMsg);
      // console.error('上传错误：', err);

      // 修复：添加安全检查并使用可选链
      const errMsg = err?.data?.msg || '';
      if (errMsg.includes('文件已超出上传数量') || errMsg.includes('收集已完成')) {
        // 修复：只有没有其他文件正在上传时才刷新详情
        const hasOtherUploading = slots.some((s, i) => i !== idx && s.uploading);
        if (!hasOtherUploading) {
          getDetail(applyUid.value);
          hasUploadingFiles.value = false;
          uploadingFileNames.value = [];
        }
      } else {
        slots[idx].files = [];
        // 检查是否还有其他文件正在上传
        const hasOtherUploading = slots.some((s) => s.uploading);
        if (!hasOtherUploading) {
          hasUploadingFiles.value = false;
          uploadingFileNames.value = [];
        }
      }
    })
    .finally(() => {
      slots[idx].uploading = false;
      uploadAbortControllers.value[idx] = null;
    });
}

function removeFile(file, idx) {
  console.log('删除文件：', file, '槽位：', idx);
  // 获取要删除的文件的 documentUid
  const documentUid = file.documentUid;

  if (!documentUid) {
    ElMessage.warning('无法获取文件 ID，删除失败');
    return;
  }

  // 调用删除接口
  loginApi
    .collectDelete(documentUid)
    .then((res) => {
      // 删除成功，清空该槽的文件列表
      slots[idx].files = [];
      ElMessage.success(`文件${idx + 1}删除成功`);

      // 检查是否还有其他文件
      const hasFiles = slots.some((s) => s.files && s.files.length > 0);
      if (!hasFiles) {
        hasUploadingFiles.value = false;
        uploadingFileNames.value = [];
      }
      // getDetail(applyUid.value);
    })
    .catch((err) => {
      // 修复：添加安全检查
      const errorMsg = err?.data?.msg || err?.msg || `文件${idx + 1}删除失败`;
      ElMessage.error(errorMsg);
      console.error('删除错误：', err);
    });
}

function submit() {
  // 检查是否还有上传中的文件
  const uploading = slots.some((s) => s.uploading);
  if (uploading) {
    ElMessage.warning('请等待所有文件上传完成');
    return;
  }

  // 检查是否有已上传的文件
  const uploaded = slots.filter((s) => s.files && s.files.length > 0).length;
  if (uploaded < slots.length) {
    console.log(slots, uploaded, slots.length, 'uploaded vs slots');
    ElMessage.warning('请上传所有文件后再提交');
    return;
  }

  isSubmitting.value = true;

  // 调用提交接口，改变状态
  console.log(slots);

  // 提取所有已上传文件的 documentUid 集合
  const documentUids = slots.filter((slot) => slot.files && slot.files.length > 0).map((slot) => slot.files[0].documentUid);
  console.log(documentUids, 'documentUids集合');

  loginApi
    .collectSubmit(applyUid.value, [...documentUids])
    .then((res) => {
      ElMessage.success('提交成功');
      // 提交成功后重新获取详情
      getDetail(applyUid.value);
    })
    .catch((err) => {
      ElMessage.error(res.msg || '提交失败');
      console.error('提交错误：', err);
    })
    .finally(() => {
      isSubmitting.value = false;
    });
}
</script>

<style lang="less" scoped>
.collect-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
}

.collect-box {
  width: 840px;
  display: flex;
  align-items: flex-start;
}

.left {
  width: 260px;
  padding-right: 20px;
}

.dept {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.dept .name {
  margin-left: 8px;
  font-weight: 600;
}

.invite {
  color: #999;
}

.right {
  flex: 1;
}

.upload-list {
  background: #fff;
}

.upload-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
}

.file-label {
  width: 65px;
  color: #666;
}

.upload {
  flex: 1;
}

.upload-placeholder {
  height: 42px;
  border: 1px dashed #d9d9d9;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #666;
}

.tips {
  color: #999;
  margin-top: 8px;
}

.tips .ban {
  color: #e53935;
  margin-top: 6px;
}

.submit-row {
  display: flex;
  justify-content: center;
  margin: 28px 0;
}

.submit-btn {
  min-width: 140px;
}

.expire {
  text-align: center;
  color: #bfbfbf;
  font-size: 12px;
}

/* 移动端适配 */
@media (max-width: 818px) {
  .collect-page {
    align-items: flex-start;
    padding: 30px 15px;
  }

  .collect-box {
    width: 100%;
    flex-direction: column;
  }

  .left {
    width: 100%;
    padding-right: 0;
    padding-bottom: 30px;
    text-align: center;
  }

  .right {
    width: 100%;
  }

  .dept {
    font-size: 18px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dept .name {
    margin-left: 0;
    margin-top: 4px;
  }

  .invite {
    font-size: 14px;
  }

  .upload-row {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .upload-row span {
    word-break: break-all;
  }

  .file-label {
    width: 100%;
    margin-bottom: 8px;
    font-size: 16px;
  }

  .upload {
    width: 100%;
  }

  .tips {
    font-size: 12px;
    padding: 0 8px;
    margin-top: 32px;
  }

  .tips div:nth-child(1) {
    margin-bottom: 6px;
  }

  .tips .ban {
    margin-top: 6px;
  }

  .submit-row {
    margin: 15px 0;
  }

  .submit-btn {
    width: 100%;
    min-width: unset;
  }

  .expire {
    font-size: 11px;
    padding: 0 8px;
    line-height: 1.6;
  }
}
</style>
