export const apiRootUrl = "0.0.0.0";
export const fileUrl = "0.0.0.0";

export function formatTime(date) {

	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hour = date.getHours();
	var minute = date.getMinutes();
	var second = date.getSeconds();
	return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':');
}

// 格式 YYYY/yyyy/YY/yy 表示年份
// MM/M 月份
// W/w 星期
// dd/DD/d/D 日期
// hh/HH/h/H 时间
// mm/m 分钟
// ss/SS/s/S 秒
//---------------------------------------------------

Date.prototype.Format = function(formatStr, date = this) {
	var str = formatStr;
	var Week = ['日', '一', '二', '三', '四', '五', '六'];

	str = str.replace(/yyyy|YYYY/, date.getFullYear());
	str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100));

	str = str.replace(/MM/, date.getMonth() + 1 > 9 ? (date.getMonth() + 1).toString() : '0' + (date.getMonth() + 1));
	str = str.replace(/M/g, date.getMonth() + 1);

	str = str.replace(/w|W/g, Week[date.getDay()]);

	str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate());
	str = str.replace(/d|D/g, date.getDate());

	str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours());
	str = str.replace(/h|H/g, date.getHours());
	str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes());
	str = str.replace(/m/g, date.getMinutes());

	str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds());
	str = str.replace(/s|S/g, date.getSeconds());

	return str;
};

export function dateFormat(formatStr, date = new Date()) {
	var str = formatStr;
	var Week = ['日', '一', '二', '三', '四', '五', '六'];

	str = str.replace(/yyyy|YYYY/, date.getFullYear());
	str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100));

	str = str.replace(/MM/, date.getMonth() + 1 > 9 ? (date.getMonth() + 1).toString() : '0' + (date.getMonth() + 1));
	str = str.replace(/M/g, date.getMonth() + 1);

	str = str.replace(/w|W/g, Week[date.getDay()]);

	str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate());
	str = str.replace(/d|D/g, date.getDate());

	str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours());
	str = str.replace(/h|H/g, date.getHours());
	str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes());
	str = str.replace(/m/g, date.getMinutes());

	str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds());
	str = str.replace(/s|S/g, date.getSeconds());

	return str;
}


/**
 * 公共网络请求方法 request
 * url 字符串 接口地址
 * data obj 请求参数对象 默认为空
 * method 字符串 HTTP 请求方法 GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT 默认为 GET
 * contentType 字符串 HTTP 头部 Content-Type 参数
 * loadingVisible 布尔值 是否显示 loading 效果
 */
export function request(url, data = {}, method = 'GET', contentType = 'application/json', loadingVisible = true) {

	if (loadingVisible) {
		showTips('Loading...', 'loading', 10000);
	}

	return new Promise(function(resolve, reject) {
		wx.request({
			url: url,
			data: data,
			method: method,
			header: {
				'Content-Type': contentType,
				'Authorization': wx.getStorageSync('Authorization')
			},
			success: function(res) {

				wx.hideToast(); // 关闭loading

				if (res.data.code === 0) {

					resolve(res.data);

				} else if (res.data.code === 403) {

				} else if (res.data.code === 423) {

				} else {

					showTips(res.data.code + '');

					reject(res.data);

				}
			},
			fail: function(err) {

				wx.hideToast(); // 关闭loading

				reject(err); //

			}
		});
	});
}


/**
 * 显示消息提示框
 * text 字符串 提示内容
 * icon 字符串 可选 success, loading 默认none
 * duration number类型 默认1500毫秒
 */
export function showToast(text, icon = 'none', duration = 1500) {
	wx.showToast({
		icon: icon,
		title: text,
		duration: duration
	});
}

/**
 * 显示操作菜单
 * itemList 数组 ['A', 'B', 'C']最大长度为 6
 * resolve 没有选择返回false 选中返回选中的索引
 */
export function showActionSheet(itemList = []) {
	return new Promise(function(resolve) {
		wx.showActionSheet({
			itemList: itemList,
			success(res) {
				resolve(res.tapIndex)
			},
			fail(res) {
				resolve(false)
			}
		});
	});
}


/**
 * 弹出modal框
 * content 字符串 提示内容
 * title 字符串 modal框标题
 * 用户点击确定返回resolve(true), 否为resolve(false)
 */
export function modal(content = '', title = '提示') {
	return new Promise(function(resolve) {
		wx.showModal({
			title: title,
			content: content,
			confirmColor: '#5CB531',
			success: function(res) {
				if (res.confirm) {
					resolve(true);
				} else {
					resolve(false);
				}
			}
		});
	});
}


