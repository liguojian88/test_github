<template>
  <div class="body">
    <div class="title">
      申请查询
    </div>
    <div class="queryBox">
      <el-form ref="queryForm" class="form" :inline="true" :model="form" label-width="auto">
        <el-form-item label="客户邮箱" label-position="left" prop="customerEmail">
          <el-input style="width: 254px;" v-model="form.customerEmail" placeholder="请输入客户邮箱" />
        </el-form-item>
        <el-form-item label="申请时间" label-position="left" style="width: 380px ;">
          <el-col :span="11">
            <el-form-item prop="createTimeBegin" style="margin: 0 0 0 0 ">
              <el-date-picker v-model="form.createTimeBegin" type="date" aria-label="Pick a date" placeholder="开始日期"
                value-format="YYYY-MM-DD" style="width: 100%" />
              <!-- :clearable= "false" -->
            </el-form-item>
          </el-col>
          <el-col class="text-center" :span="2" style="text-align: center;">
            <span class="text-gray-500" style="margin: 0 ;">至</span>
          </el-col>
          <el-col :span="11">
            <el-form-item prop="createTimeEnd" style="margin: 0 0 0 0 ">
              <el-date-picker v-model="form.createTimeEnd" type="date" aria-label="Pick a date"
                value-format="YYYY-MM-DD" placeholder="结束日期" style="width: 100%" />
              <!-- :clearable= "false" -->
            </el-form-item>
          </el-col>
          <!-- <a-range-picker style="width: 230px;"  @change="onChangeTime"  valueFormat="YYYY-MM-DD" /> -->
        </el-form-item>
        <el-form-item label="客户姓名" label-position="left" prop="customerName">
          <el-input style="width: 254px;" v-model="form.customerName" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="审批状态" label-position="left" prop="status">
          <a-space>
            <a-select ref="select" v-model:value="form.status" style="width: 254px" :options="options1"></a-select>
          </a-space>
        </el-form-item>
        <el-form-item label="文件类型" label-position="left" prop="fileCategory">
          <a-space>
            <a-select ref="selectFile" v-model:value="form.fileCategory" style="width: 254px"
              :options="optionsFile"></a-select>
          </a-space>
        </el-form-item>
        <el-form-item>
          <a-button type="primary" @click="submit">
            <template #icon>
              <SearchOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="reset" class="smart-margin-left10">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </el-form-item>
      </el-form>
    </div>
    <a-divider style="border-color: #CCD3DB; margin:  0 0 0 0;" />
    <a-button :loading="btnLoading" style="margin:  15px 0 15px 0;" type="primary" @click="jumpAddApply">
      <template #icon>
        <PlusOutlined />
      </template>
      新建
    </a-button>
    <div class="tableBox">
      <a-table class="table" :dataSource="dataSource" :columns="columns" :pagination="pagination" @change="changePage"
        :loading="tableLoading">
        <!-- 表头插槽 -->
        <!-- <template #headerCell="{ column }">
              <template v-if="column.key === 'name'">
                <span>
                  <smile-outlined />
                  Name
                </span>
              </template>
            </template> -->
        <!-- 内容插槽 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createTime'">
            {{ formatTimeByTimezone(record.createTime) }}
          </template>
          <template v-if="column.key === 'applyId'">
            <a @click.stop="jumpDetail(record)">
              {{ record.applyId }}
            </a>
          </template>
          <template v-else-if="column.key === 'file'">
            <a @click.stop="downloadFile(record)">
              {{ record.file.documentName }}
            </a>
          </template>
          <template v-else-if="column.key === 'status'">
            <span v-if="record.status == '0'" style="color: green;">
              待审核
            </span>
            <span v-if="record.status == '1'" style="color: blue;">
              通过
            </span>
            <span v-if="record.status == '2'" style="color: red;">
              驳回
            </span>
          </template>
          <template v-else-if="column.key === 'action'">

            <template v-if="record.status == '1'">
              <a style="margin:  0 0 0 15px;" @click.stop="jumpDetail(record)">
                详情
              </a>
              <a style="margin:  0 10px 0 10px;" @click.stop="copyPsw(record)">复制密码</a>
              <!-- <span style="margin:  0 10px 0 0;" @click.stop="copyPsw(record)">复制密码</span> -->
              <a @click.stop="senEamil(record)">重新发送</a>

            </template>
            <template v-if="record.status == '2'">
              <a style="margin:  0 0 0 0;" @click.stop="jumpDetail(record)">
                详情
              </a>
              <a style="margin:  0 0 0 10px;" @click.stop="Edit(record)">编辑</a>
              <a style="padding: 0 0 0 10px" @click.stop="deleteFile(record.applyId)">删除</a>
            </template>
            <template v-if="record.status == '0'">
              <a style="margin:  0 0 0 0;" @click.stop="jumpDetail(record)">
                详情
              </a>
            </template>
          </template>
        </template>
      </a-table>
    </div>
  </div>

  <a-modal :visible="deleteModel" @ok="handleOkDelete" @cancel="notDelete">
    <p>是否确认删除？</p>
  </a-modal>

  <a-modal v-model:open="noManagerModel" title="提醒" :footer="null" :maskClosable="false" width="400px">
    <div class="ulContent">
      <p>直属上级为global,项目目前不支持新建申请</p>
    </div>
    <div class="modelBottom" style="text-align: right;">
      <a-button type="primary" @click="noManagerModel = false">确认</a-button>
    </div>
  </a-modal>
</template>

<script setup>
import { reactive, ref, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'
import dayjs from 'dayjs';
import axios from 'axios';
import { useRouter, useRoute } from 'vue-router'
import { shareApi } from '/@/api/business/share/share-api.js'
import { collectApi } from '/@/api/business/collect/collect-api'
import { message } from 'ant-design-vue';
import { formatTimeByTimezone } from '/@/utils/time.js'
// 路由
const router = useRouter()
const route = useRoute()
// 变量---------------------------------------
// 记录要删除的id
const deleteId = ref()
// 是否显示二次确认删除框
const deleteModel = ref(false)
//  form表单变量
const form = reactive({
  pageNum: '1',
  pageSize: '10',
  customerName: '',
  customerEmail: "",
  status: '',
  fileCategory: "",
  createTimeBegin: '',
  createTimeEnd: ''
})
// 是否显示无上级提示框
const noManagerModel = ref(false)
const btnLoading = ref(false);
// form表单DOM元素
const queryForm = ref()
// 审批下拉框变量
const options1 = ref([
  {
    value: '',
    label: '全部',
  },
  {
    value: '0',
    label: '待审核',
  },
  {
    value: '1',
    label: '通过',
  },
  {
    value: '2',
    label: '驳回',
  },
]);
// 文件类型下拉框
const optionsFile = ref([
  {
    value: '',
    label: '全部',
    select: true
  },
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
// 表格变量
const columns = reactive(
  [
    {
      name: 'applyId',
      title: "编号",
      dataIndex: 'applyId',
      key: 'applyId',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'applyEmployeeName',
      title: "申请人",
      dataIndex: 'applyEmployeeName',
      key: 'applyEmployeeName',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },

    {
      name: 'departmentName',
      title: "部门",
      dataIndex: 'departmentName',
      key: 'departmentName',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'customerName',
      title: "客户姓名",
      dataIndex: 'customerName',
      key: 'customerName',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'customerEmail',
      title: "客户邮箱",
      dataIndex: 'customerEmail',
      key: 'customerEmail',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
      // width:150,
      // ellipsis: true,  // 超出显示省略号 
    },
    {
      name: 'file',
      title: "文档名称",
      dataIndex: 'file',
      key: 'file',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'reason',
      title: "原因",
      dataIndex: 'reason',
      key: 'reason',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      title: '审核状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
  ]
)
let tableLoading = ref(true)
var dataSource = ref()
let pagination = ref(
  {
    total: 0,
    current: '1',
    pageSize: '10',
    showTotal: function (total) {
      return `共${total}条`
    }
  }
)
// 方法-----------------------------------------------
const handleOkDelete = () => {
  deleteModel.value = false
  tableLoading.value = true
  shareApi.delete(deleteId.value).then(() => {
    getTable()
  })
}
const notDelete = () => {
  deleteModel.value = false
}
// 下载文件
const downloadFile = (record) => {

  shareApi.downLoadFile(record.file.documentId, record.file.documentName)
  // .then((res)=>{
  //   console.log(res)
  //   // message.success("下载成功")
  //    // 假设res为Blob或ArrayBuffer，若为ArrayBuffer需先转为Blob 
  //   const blob = res instanceof Blob ? res : new Blob([res.data]); 
  //   // const blob = new Blob([res.data], { 
  //   //   type: res.headers['content-type']  || 'application/zip' 
  //   // });
  //   console.log(blob)
  //   const url = URL.createObjectURL(blob);  
  //   const a = document.createElement('a');  
  //   a.href  = url; 
  //   a.download  = `${record.file.documentName}`; // 从record获取文件名或默认名 
  //   document.body.appendChild(a);  
  //   a.click();  
  //   document.body.removeChild(a);  
  //   URL.revokeObjectURL(url);  // 释放URL对象 
  //   message.success(" 下载成功"); 
  // })



  // axios.post(`https://haleonfileback.smartone.net.cn/share/fileDownload/${record.file.documentId}`,  {
  //   responseType: 'arraybuffer', // 强制二进制流接收
  //   headers: { 'Accept': 'application/octet-stream' },
  //   timeout: 30000, // 2025年推荐超时设置 
  // }).then((res)=>{
  //       console.log(res)
  //     const blob = res instanceof Blob ? res : new Blob([res.data]); 
  //     // const blob = new Blob([res.data], { 
  //     //   type: res.headers['content-type']  || 'application/zip' 
  //     // });
  //     const url = URL.createObjectURL(blob);  
  //     const a = document.createElement('a');  
  //     a.href  = url; 
  //     a.download  = `${record.file.documentName}`; // 从record获取文件名或默认名 
  //     document.body.appendChild(a);  
  //     a.click();  
  //     document.body.removeChild(a);  
  //     URL.revokeObjectURL(url);  // 释放URL对象 
  //     message.success(" 下载成功"); 
  // })
  // .catch(err => {
  //   console.error(' 请求失败:', err.isAxiosError  ? err.message  : err);
  // });
}
// 发送邮件
const senEamil = (record) => {
  // alert(JSON.stringify(record))
  // console.log(record.applyId)
  shareApi.sendEmail(record.applyId).then((res) => {
    message.success("邮件发送成功")
  })
}
// 跳转到新建申请
const jumpAddApply = () => {
  btnLoading.value = true;
  collectApi.checkManager().then((res) => {
    if (res.data != '1') {
      // 没有上级，显示提示弹窗
      noManagerModel.value = true
    } else {
      router.push("/share/list/addApply")
    }
  }).finally(() => {
    btnLoading.value = false;
  })
}
// 跳转到申请详情
const jumpDetail = (record) => {
  router.push({
    path: "/share/list/applyDetail",
    query: {
      applyId: record.applyId,
      from: 'apply'
    }
  })
}
// 切换分页切换table
const changePage = (page) => {
  tableLoading.value = true
  form.pageNum = page.current
  form.pageSize = page.pageSize
  getTable()
}

// 提交查询表单
const submit = () => {
  form.pageNum = '1'
  tableLoading.value = true
  // 处理时间格式：开始日期添加 00:00:00，结束日期添加 23:59:59
  if (form.createTimeBegin) {
    form.createTimeBegin = dayjs(form.createTimeBegin).format('YYYY-MM-DD 00:00:00')
  }
  if (form.createTimeEnd) {
    form.createTimeEnd = dayjs(form.createTimeEnd).format('YYYY-MM-DD 23:59:59')
  }
  getTable()
}
// 重置
const reset = () => {
  form.pageNum = '1'
  queryForm.value.resetFields();
  tableLoading.value = true
  getTable()
}
// 获取table数据
const getTable = () => {
  shareApi.queryPage(form).then((res) => {
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
    pagination.value.current = res.data.pageNum
    tableLoading.value = false
  })
}
// 删除文件
const deleteFile = (id) => {
  deleteModel.value = true
  deleteId.value = id
  // tableLoading.value = true
  // shareApi.delete(id).then(()=>{
  //   getTable()
  // })
}
// 编辑驳回文件
const Edit = (record) => {
  router.push({
    path: "/share/list/editApply",
    query: {
      applyId: record.applyId,
      fileCategory: record.file.fileCategory
    }
  })
}
// 复制密码
const copyPsw = (record) => {
  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(record.file.downloadToken);
      message.success(' 复制成功');
    } else {
      // 降级方案 
      const textarea = document.createElement('textarea');
      textarea.value = record.file.downloadToken;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success(' 复制成功');
    }
  } catch (err) {
    console.error(' 复制失败:', err);
    message.error(' 复制失败，请手动复制');
  }

  // navigator.clipboard.writeText(record.file.downloadToken).then(()=>{
  //   message.success('复制成功')
  // })
}
//vue3生命周期
onBeforeMount(() => {

})
onMounted(() => {
  // 初始化的时候加载一次表格数据
  getTable()
})
onBeforeUpdate(() => { })
onUpdated(() => { })
onBeforeUnmount(() => { })
onUnmounted(() => { })
</script>

<style scoped lang="scss">
.body {
  background-color: white;
  height: 87vh;
  padding: 20px 15px 0 15px;
}

.title {
  font-size: 2vh;
  font-weight: bold;
  padding: 0 0 20px 0;
}

.queryBox {
  .form {
    // max-width: 80vw;
  }
}

.tableBox {
  .table :deep(.ant-table-cell) {
    max-width: 200px;
    white-space: normal;
    /* 允许换行（覆盖默认的 nowrap） */
    word-break: break-word;
  }
}
</style>