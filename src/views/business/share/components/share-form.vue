<!--
  * 文件分享申请
  *
  * @Author:    LouXD
  * @Date:      2025-11-12 17:25:14
  * @Copyright  1.0
-->
<template>
  <a-modal
      :title="form.id ? '编辑' : '添加'"
      :width="500"
      :open="visibleFlag"
      @cancel="onClose"
      :maskClosable="false"
      :destroyOnClose="true"
  >
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }" >
        <a-form-item label="申请ID"  name="id">
          <a-input-number style="width: 100%" v-model:value="form.id" placeholder="申请ID" />
        </a-form-item>
        <a-form-item label="文件ID"  name="fileId">
          <FileUpload
              :defaultFileList="form.fileId"
              :folder="FILE_FOLDER_TYPE_ENUM.COMMON.value"
              buttonText="上传 文件ID"
              listType="text"
              @change="e => form.fileId = e"
          />
        </a-form-item>
        <a-form-item label="文件类型"  name="fileCategory">
          <SmartEnumSelect width="100%" v-model:value="form.fileCategory" enum-name="" placeholder="文件类型"/>
        </a-form-item>
        <a-form-item label="客户姓名"  name="custName">
          <a-input style="width: 100%" v-model:value="form.custName" placeholder="客户姓名" />
        </a-form-item>
        <a-form-item label="客户邮箱"  name="custEmail">
          <a-input style="width: 100%" v-model:value="form.custEmail" placeholder="客户邮箱" />
        </a-form-item>
        <a-form-item label="申请原因"  name="reason">
          <a-textarea style="width: 100%" v-model:value="form.reason" placeholder="申请原因" />
        </a-form-item>
        <a-form-item label="允许下载最大次数"  name="maxDownloads">
          <a-input-number style="width: 100%" v-model:value="form.maxDownloads" placeholder="允许下载最大次数" />
        </a-form-item>
    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="onClose">取消</a-button>
        <a-button type="primary" @click="onSubmit">保存</a-button>
      </a-space>
    </template>
  </a-modal>
</template>
<script setup>
  import { reactive, ref, nextTick } from 'vue';
  import _ from 'lodash';
  import { message } from 'ant-design-vue';
  import { SmartLoading } from '/@/components/framework/smart-loading';
  import { shareApi } from '/@/api/business/share/share-api';
  import { smartSentry } from '/@/lib/smart-sentry';
  import FileUpload from '/@/components/support/file-upload/index.vue';
  import SmartEnumSelect from '/@/components/framework/smart-enum-select/index.vue';
  import { FILE_FOLDER_TYPE_ENUM } from '/@/constants/support/file-const';

  // ------------------------ 事件 ------------------------

  const emits = defineEmits(['reloadList']);

  // ------------------------ 显示与隐藏 ------------------------
  // 是否显示
  const visibleFlag = ref(false);

  function show(rowData) {
    Object.assign(form, formDefault);
    if (rowData && !_.isEmpty(rowData)) {
      Object.assign(form, rowData);
    }
    // 使用字典时把下面这注释修改成自己的字典字段 有多个字典字段就复制多份同理修改 不然打开表单时不显示字典初始值
    // if (form.status && form.status.length > 0) {
    //   form.status = form.status.map((e) => e.valueCode);
    // }
    visibleFlag.value = true;
    nextTick(() => {
      formRef.value.clearValidate();
    });
  }

  function onClose() {
    Object.assign(form, formDefault);
    visibleFlag.value = false;
  }

  // ------------------------ 表单 ------------------------

  // 组件ref
  const formRef = ref();

  const formDefault = {
      id: undefined, //申请ID
      fileId: undefined, //文件ID
      fileCategory: undefined, //文件类型
      custName: undefined, //客户姓名
      custEmail: undefined, //客户邮箱
      reason: undefined, //申请原因
      maxDownloads: undefined, //允许下载最大次数
  };

  let form = reactive({ ...formDefault });

  const rules = {
      fileId: [{ required: true, message: '文件ID 必填' }],
      fileCategory: [{ required: true, message: '文件类型 必填' }],
      custName: [{ required: true, message: '客户姓名 必填' }],
      custEmail: [{ required: true, message: '客户邮箱 必填' }],
      reason: [{ required: true, message: '申请原因 必填' }],
      maxDownloads: [{ required: true, message: '允许下载最大次数 必填' }],
  };

  // 点击确定，验证表单
  async function onSubmit() {
    try {
      await formRef.value.validateFields();
      save();
    } catch (err) {
      message.error('参数验证错误，请仔细填写表单数据!');
    }
  }

  // 新建、编辑API
  async function save() {
    SmartLoading.show();
    try {
      if (form.id) {
        await shareApi.update(form);
      } else {
        await shareApi.add(form);
      }
      message.success('操作成功');
      emits('reloadList');
      onClose();
    } catch (err) {
      smartSentry.captureError(err);
    } finally {
      SmartLoading.hide();
    }
  }

  defineExpose({
    show,
  });
</script>
