const fenest = require('../../base/base.js');

Page({
	data: {
		sms: '',
		phone: '',
		btn: '发送验证码'

	},
	onReady: function(e) {

	},
	onRegist() {
		wx.navigateTo({
			url: '../player-index/index'
		});
	}
});
