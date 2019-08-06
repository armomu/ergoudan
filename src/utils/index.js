import moment from 'moment';
// eslint-disable-next-line import/prefer-default-export
function formatTime(val) {
    if (val < 10) {
        return '0' + val;
    } else {
        return val;
    }
}

/**
 * 数据 URL 拼接字符串
 * @param  {object} data 对象
 * @returns {string} URL 拼接字符串
 */
export function spliceUrl(data) {
    let searchUrl = '?';
    Object.keys(data).forEach((key) => {
        searchUrl += key + '=' + data[key] + '&';
    });
    return searchUrl;
}

/**
 * 格式化秒数为时间格式 00：00：00
 * @param  {number} value 秒数
 * @param  {string} d 时间的格式 列 '小时|分|秒'
 * @returns {string} 00：00：00
 */
export function formatSeconds(value, d) {
    var secondTime = parseInt(value || 0);// 秒
    var minuteTime = 0;// 分
    var hourTime = 0;// 小时
    if (secondTime > 60) {
        //如果秒数大于60，将秒数转换成整数
        //获取分钟，除以60取整数，得到整数分钟
        minuteTime = parseInt(secondTime / 60);

        //获取秒数，秒数取佘，得到整数秒数
        secondTime = parseInt(secondTime % 60);

        //如果分钟大于60，将分钟转换成小时
        if (minuteTime > 60) {
            //获取小时，获取分钟除以60，得到整数小时
            hourTime = parseInt(minuteTime / 60);

            //获取小时后取佘的分，获取分钟除以60取佘的分
            minuteTime = parseInt(minuteTime % 60);
        }
    }
    var result = '';
    if (d) {
        const arr = d.split('|');
        if (minuteTime > 0) {
            result = `${parseInt(minuteTime)}${arr[1]}${parseInt(secondTime)}${arr[2]}`;
        }
        if (hourTime > 0) {
            result = `${parseInt(hourTime)}${arr[0]}${result}`;
        }

    } else {
        result = formatTime(parseInt(hourTime)) + '：' + formatTime(parseInt(minuteTime)) + '：' + formatTime(parseInt(secondTime));
    }
    return result;
}
/**
 * Parse the time to string
 * @param {(Object|string|number)} time
 * @param {string} cFormat
 * @returns {string}
 */
export function parseTime(time, cFormat) {
    if (arguments.length === 0) {
        return null;
    }
    const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}';
    let date;
    if (typeof time === 'object') {
        date = time;
    } else {
        if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
            time = parseInt(time);
        }
        if ((typeof time === 'number') && (time.toString().length === 10)) {
            time = time * 1000;
        }
        date = new Date(time);
    }
    const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
    };
    const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
        let value = formatObj[key];
        // Note: getDay() returns 0 on Sunday
        if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value]; }
        if (result.length > 0 && value < 10) {
            value = '0' + value;
        }
        return value || 0;
    });
    return time_str;
}

export function momentTime(time) {
    return moment(time).format('LL');
}

export function monthFormat(month) {
    let obj = null;
    if (month) {
        obj = {
            month: moment(month).month() + 1,
            stime: moment(moment(month).startOf('month')).unix(),
            etime: moment(moment(month).endOf('month')).unix()
        };
    } else {
        obj = {
            month: moment().month() + 1,
            stime: moment(moment().startOf('month')).unix(),
            etime: moment(moment().endOf('month')).unix()
        };
    }
    return obj;
}
