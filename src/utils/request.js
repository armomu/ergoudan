import Taro from '@tarojs/taro';
import Authorize from './authorize';

const BASE_URL = '192.168.0.1:8080';
/**
 * 公共接口请求方法
 * @param  {object} option 对象
 * @param  {string} option.url 接口地址
 * @param  {object} option.data 请求参数
 * @param  {string} option.method 请求方法，默认 get
 * @param  {object} option.header http 头部信息
 * @param  {boolean} option.Loading 加载效果，默认小程序工具条加载效果
 * @param  {string} option.loadingType 加载类型，可选 'navigationBarLoading'，'other'
 * @returns {object} Promise
 */
export default function request(option) {
    option = option || {};
    option.url = option.url || '';
    option.data = option.data || {};
    option.method = option.method || 'get';
    option.header = option.header || {};
    option.Loading = typeof option.loading === 'undefined' ? true : option.loading;
    option.loadingType = option.loadingType || 'navigationBarLoading';

    if (option.Loading) {
        if (option.loadingType === 'navigationBarLoading') {
            Taro.showNavigationBarLoading();
        } else {
            Taro.showLoading({
                title: '加载中'
            });
        }
    }
    const token = Authorize.getToken();
    if (token) {
        option.header['Authorization'] = token;
    }


    return new Promise((resolve, reject) => {
        // console.log(option.data);
        Taro.request({
            url: `${BASE_URL}${option.url}`,
            data: option.data,
            method: option.method,
            header: option.header,
        })
            .then((res) => {
                // console.log(res.data.data);
                resolve(res.data);
            })
            .catch((err) => {
                reject(err);
                option.loadingType === 'navigationBarLoading' ? Taro.hideNavigationBarLoading() : Taro.hideLoading();
                Taro.showToast({ title: '请求超时', icon: 'none' });
            });
    });
}
