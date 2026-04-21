<template>
  <div class="body">
    <div class="title">
      审批查询
    </div>
    <div class="queryBox">
      <el-form class="form" ref="queryForm" :inline="true" :model="form" label-width="auto">
        <!-- <el-form-item label="申请人" label-position="left" prop="applyEmployeeName">
              <el-input style="width: 254px;" v-model="form.applyEmployeeName"  placeholder="请输入申请人姓名"/>
            </el-form-item>
            <el-form-item label="审批人" label-position="left" prop="operateEmployeeName">
              <el-input style="width: 254px;" v-model="form.operateEmployeeName" placeholder="请输入审批人员" />
            </el-form-item> -->
        <el-form-item label="操作人" label-position="left" prop="operateEmployeeName">
          <el-input style="width: 254px;" v-model="form.applyEmployeeName" placeholder="请输入申请人姓名" />
        </el-form-item>
        <el-form-item label="申请时间" label-position="left" style="width: 380px ;">
          <el-col :span="11">
            <el-form-item prop="applyTimeBegin" style="margin: 0 0 0 0 ">
              <el-date-picker v-model="form.applyTimeBegin" type="date" aria-label="Pick a date" placeholder="开始日期"
                value-format="YYYY-MM-DD 00:00:00" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col class="text-center" :span="2" style="text-align: center;">
            <span class="text-gray-500" style="margin: 0 ;">至</span>
          </el-col>
          <el-col :span="11">
            <el-form-item prop="applyTimeEnd" style="margin: 0 0 0 0 ">
              <el-date-picker v-model="form.applyTimeEnd" type="date" aria-label="Pick a date"
                value-format="YYYY-MM-DD 23:59:59" placeholder="结束日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-form-item>
        <el-form-item label="客户姓名" label-position="left" prop="customerName">
          <el-input style="width: 254px;" v-model="form.customerName" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="客户邮箱" label-position="left" prop="customerEmail">
          <el-input style="width: 254px;" v-model="form.customerEmail" placeholder="请输入客户邮箱" />
        </el-form-item>
        <el-form-item label="审批状态" label-position="left" prop="action">
          <a-space>
            <a-select ref="select" v-model:value="form.action" style="width: 254px" :options="options1"></a-select>
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
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'operateId'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-if="column.key === 'applyTime'">
            {{ formatTimeByTimezone(record.applyTime) }}
          </template>
          <template v-if="column.key === 'createTime'">
            {{ formatTimeByTimezone(record.createTime) }}
          </template>
          <template v-if="column.key === 'category'">
            <span v-if="record.category == '1'">
              文件收集
            </span>
            <span v-else>
              文件分享
            </span>
          </template>
          <template v-else-if="column.key === 'file'">
            <a @click.stop="downloadFile(record)">
              {{ record.shareName }}
            </a>
          </template>
          <template v-else-if="column.key === 'action'">
            <span v-if="record.action == '0'">
              发起申请
            </span>
            <span v-else-if="record.action == '1'">
              通过
            </span>
            <span v-else>
              驳回
            </span>
          </template>
          <template v-else-if="column.key === 'caozuo'">
            <a @click.stop="checkDetail(record)">查看详情</a>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'
import dayjs from 'dayjs';
import { operateApi } from '/@/api/business/operate/operate-api.js'
import { useRouter, useRoute } from 'vue-router'
// 路由
const router = useRouter()
const route = useRoute()
// 变量 --------------------------------------------
// queryBox盒子 form表单查询相关的变量和方法
const form = reactive({
  pageNum: '1',
  pageSize: '10',
  // applyEmployeeName:'',
  applyTimeBegin: '',
  applyTimeEnd: '',
  customerName: "",
  customerEmail: '',
  action: '',
  operateEmployeeName: '',
})
// form表单DOM元素
const queryForm = ref()
// 审批状态下拉框变量
const options1 = ref([
  {
    value: '',
    label: '全部',
    select: true
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
// 控制表单加载状态
let tableLoading = ref(true)

// 审批表格
const columns = reactive(
  [
    {
      name: 'operateId',
      title: "编号",
      dataIndex: 'operateId',
      key: 'operateId',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      })
    },
    {
      name: 'applyEmployeeName',
      title: "操作人",
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
      name: 'category',
      title: "模块",
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'action',
      title: "动作",
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
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
      name: 'applyTime',
      title: "申请时间",
      dataIndex: 'applyTime',
      key: 'applyTime',
      align: 'center',
      customHeaderCell: () => ({
        style: {
          backgroundColor: '#F2F3F5',  // 背景色
          fontWeight: 'bold'
        }
      }),
    },
    {
      name: 'createTime',
      title: "操作时间",
      dataIndex: 'createTime',
      key: 'createTime',
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
      title: '记录编号',
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
      title: '操作',
      key: 'caozuo',
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

const dataSource = ref()
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
// 方法------------------------------------------------------
// 切换分页切换table
const changePage = (page) => {
  tableLoading.value = true
  form.pageNum = page.current
  form.pageSize = page.pageSize
  getTable()
}
// 提交表单
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
const reset = () => {
  console.log(1)
  form.pageNum = '1'
  queryForm.value.resetFields();
  tableLoading.value = true
  getTable()
}
// 获取table数据
const getTable = () => {
  operateApi.queryPage(form).then((res) => {
    dataSource.value = res.data.list
    pagination.value.total = res.data.total
    pagination.value.current = res.data.pageNum
    tableLoading.value = false
  })
}

// 下载文件
const downloadFile = (record) => {
  if(!record.shareUrl) return false;

  // 创建一个隐藏的a标签来触发下载
  const link = document.createElement('a');
  link.href = record.shareUrl;
  link.download = record.shareName || 'download'; // 设置下载文件名
  link.target = '_blank'; // 在新标签页打开
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 根据用户时区格式化时间
const formatTimeByTimezone = (timeStr) => {
  if (!timeStr) return ''
  try {
    // 将服务器时间字符串转换为 ISO 格式（假设服务器时间是 UTC 时间）
    // 如果时间字符串格式是 "YYYY-MM-DD HH:mm:ss"，转换为 ISO 格式并添加 'Z' 表示 UTC
    let isoTimeStr = timeStr
    if (timeStr.includes(' ') && !timeStr.includes('T') && !timeStr.includes('Z')) {
      // 将空格替换为 T，并添加 Z 表示 UTC 时间
      isoTimeStr = timeStr.replace(' ', 'T') + 'Z'
    }
    // 创建 Date 对象，会自动将 UTC 时间转换为用户本地时区
    const date = new Date(isoTimeStr)
    // 使用 dayjs 格式化时间，显示为 YYYY-MM-DD HH:mm 格式
    return dayjs(date).format('YYYY-MM-DD HH:mm')
  } catch (error) {
    console.error('时间格式化错误:', error)
    return timeStr.substring(0, 16)
  }
}

const checkDetail = (record) => {
  if (record.category == '1') {
    // 文件收集
    router.push({
      path: "/collect/list/collectDetail",
      query: {
        applyId: record.applyId,
        from: 'operateLog'
      }
    })
  } else {
    // 文件分享
    router.push({
      path: "/share/list/applyDetail",
      query: {
        applyId: record.applyId,
        from: 'operateLog'
      }
    })
  }

}
//vue3生命周期
onBeforeMount(() => {
  getTable();
})
onMounted(() => { })
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
  margin: 15px 0 0 0;

  .table :deep(.ant-table-cell) {
    max-width: 200px;
    white-space: normal;
    /* 允许换行（覆盖默认的 nowrap） */
    word-break: break-word;
  }
}
</style>