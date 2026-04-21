import dayjs from 'dayjs'

// 根据用户时区格式化时间
export  const formatTimeByTimezone = (timeStr) => {
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