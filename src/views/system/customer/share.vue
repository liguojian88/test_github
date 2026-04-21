<template>
  <div class="share-container">
    <!-- App浏览器提示弹窗 -->
    <div v-if="showAppTip" class="app-browser-tip" @click="showAppTip = false">
      <div class="tip-content" @click.stop>
        <div class="tip-text">
          <h3>点击右上角 <strong>···</strong> 或 <strong>⊙</strong></h3>
          <p>{{ iosText }}</p>
          <el-button class="tip-close" type="primary" @click="showAppTip = false">知道了</el-button>
          <!-- <div class="tip-close" @click="showAppTip = false">知道了</div> -->
        </div>
      </div>
    </div>

    <div class="contantBox">
      <h2 class="tt1">{{ allData?.file?.documentName }}</h2>
      <p class="tt2">{{ allData.departmentName }}<span>{{ allData.applyEmployeeName }}</span></p>
      <p class="tt3">向你分享了文档</p>
      <p class="tt4">有效期至：<span>{{ formatTimeByTimezone(allData?.file?.fileInvalidTime) }}</span></p>
      <div class="textBox">
        <el-input v-model="dowmloadToken" style="width: 400px" placeholder="请输入6位文件口令" class="input-with-select">
          <template #append>
            <el-button type="primary" @click="downFile">确认</el-button>
          </template>
        </el-input>
      </div>
      <p class="tt5">*请联系分享人 获取一次性口令</p>
      <el-progress type="circle" :percentage="percentage" v-if="percentage > 0">
        <template #default="{ percentage }">
          <div class="progress_content">
            <span class="percentage-value">{{ percentage }}%</span>
            <span class="percentage-label">
              {{ percentage == 100 ? '下载完成' : '正在下载...' }}
            </span>
          </div>
        </template>
      </el-progress>
    </div>
  </div>
</template>
<script setup>
import { message } from 'ant-design-vue';
import { ElMessageBox } from 'element-plus';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loginApi } from '/@/api/system/login-api';
import axios from 'axios'; // 确保已安装axios
import { formatTimeByTimezone } from '/@/utils/time.js'
const route = useRoute();
const router = useRouter();
const percentage = ref(0)
const allData = ref({})
const dowmloadToken = ref('')
const showAppTip = ref(false) // 控制App浏览器提示显示
// 下载相关
const isDownloading = ref(false); // 防止重复下载
const iosText = ref('')

// 检测是否在移动设备App内置浏览器中
const isInAppBrowser = () => {
  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(userAgent);
  iosText.value = isIOS ? '选择【在Safari中打开】或【用默认浏览器打开】，以便查找下载文件' : '选择在默认【浏览器】打开，以便查找下载文件';

  // 检测常见的移动App内置浏览器
  const appPatterns = [
    'MicroMessenger', // 微信
    'QQ', // QQ
    'DingTalk', // 钉钉
    'wxwork', // 企业微信
    'AliApp', // 阿里系应用
    'WeChat', // 微信(另一种标识)
    'baiduboxapp', // 百度App
    'newsarticle', // 今日头条
    'QQBrowser', // QQ浏览器
    'UCBrowser', // UC浏览器
    'SogouMobileBrowser', // 搜狗浏览器
    'MiuiBrowser', // 小米浏览器
    'OPPOBrowser', // OPPO浏览器
    'vivoBrowser', // vivo浏览器
    'HUAWEIBrowser', // 华为浏览器
    'SamsungBrowser', // 三星浏览器
    // 邮箱客户端
    'Mail', // 通用邮箱标识
    'NetEase', // 网易邮箱（包括163、126邮箱）
    '163Mail', // 163邮箱
    '126Mail', // 126邮箱
    'yeah', // yeah邮箱
    'QQMail', // QQ邮箱 ✅
    'QQMail', // QQ邮箱
    'qmail', // QQ邮箱(另一种标识)
    'qqmail', // QQ邮箱(小写)
    'foxmail', // Foxmail邮箱
    'Foxmail', // Foxmail邮箱
    'Gmail', // Gmail
    'Outlook', // Outlook邮箱
    'Exchange', // Exchange邮箱
    'EWS', // Exchange Web Services
    'Thunderbird', // Thunderbird邮箱
    'spark', // Spark邮箱
    'Newton', // Newton邮箱
    'Airmail', // Airmail邮箱
    'Edison', // Edison邮箱
    'BlueMail', // BlueMail邮箱
    'ProtonMail', // ProtonMail邮箱
    'Yandex', // Yandex邮箱
    'Yahoo', // Yahoo邮箱
    'mail_ru', // 俄罗斯mail.ru邮箱
    'web_de', // 德国web.de邮箱
    'gmx', // GMX邮箱
  ];

  // 检查是否匹配任何App的User-Agent特征
  const isApp = appPatterns.some(pattern => userAgent.includes(pattern));

  // 如果是移动设备（iOS或Android）并且在App中打开
  return (isIOS || isAndroid) && isApp;
}

onMounted(() => {
  // 检测是否在App内置浏览器中，如果是则显示提示
  if (isInAppBrowser()) {
    showAppTip.value = true;
  }

  getDetail(route.query.applyUid)
  // setInterval(() => {
  //   percentage.value += 10
  //   if (percentage.value > 100) {
  //     percentage.value = 100
  //   }
  // }, 500)
});
function getDetail(applyUid) {
  loginApi.shareContent(applyUid).then((res) => {
    allData.value = res.data
  });
}
function downFile() {
  if (!dowmloadToken.value) {
    message.success('请先输入口令')
    return
  }
  if (isDownloading.value) {
    message.warning('文件正在下载中，请稍候');
    return;
  }
  // loginApi.shareDown(dowmloadToken.value).then((res)=>{
  //   console.log(res, "下载内容")
  // });
  // 重置进度
  percentage.value = 0;
  isDownloading.value = true;

  // 直接使用axios进行下载，只发送一次请求
  axios({
    method: 'post',
    url: import.meta.env.VITE_APP_API_URL + `/user/share/fileDownload/${dowmloadToken.value}`,
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      if (progressEvent.lengthComputable) {
        // 计算下载百分比
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        percentage.value = percentCompleted;
        console.log(`下载进度: ${percentCompleted}%`);
      } else {
        // 如果无法获取总大小，使用模拟进度
        if (percentage.value < 90) {
          percentage.value += 10;
        }
      }
    },
  })
    .then((response) => {
      // 检查响应类型，判断是文件还是错误信息
      const contentType = response.headers['content-type'] || '';
      console.log(contentType)
      // 如果响应是JSON类型，说明是错误信息
      if (contentType.includes('application/json')) {
        // 将blob转换为JSON
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            percentage.value = 0;
            message.warning(errorData.msg || '下载失败');
            isDownloading.value = false;
          } catch (e) {
            percentage.value = 0;
            message.error('解析错误信息失败');
            isDownloading.value = false;
          }
        };
        reader.readAsText(response.data);
        return;
      }

      // 下载完成，设置为100%
      percentage.value = 100;

      // 创建下载链接并触发下载
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // 从响应头获取文件名，如果没有则使用默认名
      // const contentDisposition = response.headers['content-disposition'];
      let fileName = allData.value?.file?.documentName;
      // if (contentDisposition) {
      //   const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      //   if (fileNameMatch && fileNameMatch.length >= 2) {
      //     // 处理可能的URL编码文件名
      //     fileName = decodeURIComponent(fileNameMatch[1]);
      //   }
      // }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // 释放URL对象
      window.URL.revokeObjectURL(url);

      message.success('文件下载完成！');
      // 弹窗提示文件保存位置
      // ElMessageBox.alert(
      //   'iPhone/iPad：请在"文件"App中查看\nAndroid：请在"下载"或"文件管理"中查看\n电脑：在浏览器下载文件夹中',
      //   '文件已下载',
      //   {
      //     confirmButtonText: '知道了',
      //     type: 'success',
      //     customClass: 'download-tip-modal'
      //   }
      // );
      isDownloading.value = false;
    })
    .catch((error) => {
      percentage.value = 0;

      if (axios.isCancel(error)) {
        console.log('下载已取消');
        message.warning('下载已取消');
      } else {
        console.error('下载失败:', error);

        // 尝试从错误响应中获取错误信息
        if (error.response && error.response.data) {
          // 如果错误响应是blob类型，尝试解析
          if (error.response.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorData = JSON.parse(reader.result);
                message.error(errorData.msg || '下载失败，请重试');
              } catch (e) {
                message.error(error.response?.statusText || error.message || '下载失败，请重试');
              }
            };
            reader.readAsText(error.response.data);
          } else {
            message.error(error.response.data?.msg || error.response?.statusText || '下载失败，请重试');
          }
        } else {
          message.error(error.message || '下载失败，请重试');
        }
      }
      isDownloading.value = false;
    })

}
// 清理函数
onUnmounted(() => {
});
</script>
<style lang="less" scoped>
/* App浏览器提示弹窗样式 */
.app-browser-tip {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  animation: fadeIn 0.3s ease-in-out;

  .tip-content {
    position: relative;
    text-align: center;
    color: white;
    max-width: 300px;

    .tip-arrow {
      font-size: 60px;
      margin-bottom: 10px;
      animation: bounce 1s infinite;
    }

    .tip-text {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);

      h3 {
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: 600;

        strong {
          color: #409eff;
          font-size: 20px;
        }
      }

      p {
        margin: 0 0 15px 0;
        font-size: 14px;
        opacity: 0.9;
        line-height: 1.5;
      }

      .tip-close {
        color: white;
        border-radius: 5px;
        font-size: 14px;
        cursor: pointer;
        display: inline-block;
        font-weight: 500;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.share-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .contantBox {
    text-align: center;

    .tt1 {
      font-size: 28px;
      color: rgba(22, 93, 255, 1);
      margin-bottom: 50px;
    }

    .tt2 {
      font-size: 20px;
      color: rgba(67, 67, 67, 0.99);
      margin-bottom: 15px;
      font-weight: 400;
    }

    .tt3 {
      font-size: 18px;
      color: rgba(153, 153, 153, 1);
      margin-bottom: 15px;
      font-weight: 400;
    }

    .tt4 {
      font-size: 14px;
      color: rgba(90, 90, 90, 1);
      margin-bottom: 15px;
    }

    .tt5 {
      font-size: 14px;
      color: rgba(16, 16, 16, 1);
      margin-top: 10px;
    }
  }
}

/* 强制按钮颜色 */
:deep(.el-button--primary) {
  background-color: #409eff !important;
  border-color: #409eff !important;
  color: #fff !important;
}

/* 下载提示弹窗样式 */
:deep(.download-tip-modal .el-message-box__message) {
  white-space: pre-line;
  line-height: 1.8;
}


@media (max-width: 818px) {
  .share-container {
    padding: 30px 0;
    box-sizing: border-box;
    align-items: flex-start;
  }

  .contantBox {
    box-sizing: border-box;
    padding: 0 15px;
    width: 100%;
  }

  .tt1 {
    font-size: 22px !important;
    word-break: break-all;
    margin-bottom: 30px !important;
  }

  .tt2 {
    word-break: break-all;
    font-size: 18px !important;
  }

  .textBox :deep(.el-input) {
    width: 350px !important;
    gap: 10px;
  }
}

.progress_content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.percentage-label {
  margin-top: 5px;
  font-size: 14px;
  color: #999;
}
</style>
