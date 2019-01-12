var app = getApp();
App({
  onLaunch: function () {

  },
  globalData: {
    storeInfo:{
        id:0,///
        name:'北京市朝阳区日坛北路日坛测试门店',//
        shortName:'北京市朝阳区日坛北路日坛测试门店',
        phoneList:['0755-82760305','10086'],
        imageList:[
            {
                images:'http://img02.tooopen.com/images/20150928/tooopen_sy_143912755726.jpg',
                url:'/2'
            },
            {
                images:'http://img06.tooopen.com/images/20160818/tooopen_sy_175866434296.jpg',
                url:'/3',
            },
            {
                images:'http://img06.tooopen.com/images/20160818/tooopen_sy_175833047715.jpg',
                url:'/4',
            }
        ],
        cover:'http://img06.tooopen.com/images/20160818/tooopen_sy_175833047715.jpg',
        cityLevel:1,
        address:'北京市朝阳区日坛北路日坛国际贸易中心1层Y23',//深圳市福田区金田路嘉意台裙楼趣坊商城二层202号
        lng:114.068690,
        lat:22.531920,
        distance:0,
        businessHoursDesc:'周一至周日 10:00 至 22:00 营业',

    },
    userInfo: {
      nickname: 'Hi,游客',
      name: '点击去登录',
      sex: '1',
      birthday: '2018-01-01',
      height: '175',
      image: 'http://yanxuan.nosdn.127.net/8945ae63d940cc42406c3f67019c5cb6.png'
    }
  }
});
