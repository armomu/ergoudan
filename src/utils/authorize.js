import Taro from '@tarojs/taro';
import { wxSigninBindPhoneNumber, checkUser } from '../api/user';
import counterStore from '../store';

// 校验用户权限类
export default class Authorize {
    /**
     * 微信授权登陆
     * @param  {string} code wx.login(res) res.code
     * @param  {object} e Button 组件返回值 e.detail.userInfo
     * @param  {object} userInfo Button 组件返回值 e.detail.userInfo
     * @returns {object} Promise
     */
    static wxSignin(code, e, userInfo) {
        return new Promise((resolve, reject) => {
            if (e.detail.errMsg === 'getPhoneNumber:ok') {
                wxSigninBindPhoneNumber(code, e, userInfo)
                    .then((wxres) => {
                        // 保存登陆信息 
                        this.setToken(wxres.data).then(() => {
                            counterStore.setLoginStatus(true);
                            resolve(wxres);
                        });

                    })
                    .catch(() => {
                        reject('微信登录失败');
                    });
            } else {
                reject('取消授权');
            }
        });
    }

    /**
     * 检查用户是否存在
     * @param  {boolean} autoJump 如果没有登陆是否自动跳转到登陆页面
     * @returns {object} Promise
     */
    static getUserInfo(e) {
        return new Promise((resolve, reject) => {
            if (e.detail.errMsg === 'getUserInfo:ok') {
                Taro.login()
                    .then((res) => {
                        checkUser(res.code).then((wxres) => {
                            // 保存登陆信息 
                            this.setToken(wxres.data).then(() => {
                                counterStore.setLoginStatus(true);
                                Taro.showToast({
                                    title: '登录成功！',
                                    icon: 'none'
                                });
                                resolve(wxres.data);
                            });

                        }).catch(() => {
                            Taro.navigateTo({
                                url: '/pages/login/index'
                            });
                            reject('非法用户');
                        });
                    })
                    .catch(() => {
                        Taro.showToast({
                            title: '微信登录失败',
                            icon: 'none'
                        });
                    });
            } else {
                reject('取消授权');
            }
        });
    }
    /**
     * 检查用户 Authorization 是否存在
     * @param  {boolean} autoJump 如果没有登陆是否自动跳转到登陆页面
     * @returns {object} Promise
     */
    static checkSignin(status) {
        const autoJump = typeof status === 'undefined' ? true : status;
        const res = Taro.getStorageSync('Authorization');
        if (res !== '' && res !== undefined && res !== 'undefined') {
            return res;
        } else {
            if (autoJump) {
                Taro.navigateTo({
                    url: '/pages/login/index'
                });
                return false;
            } else {
                return false;
            }
        }

    }

    // 获取微信授权的用户信息
    static checkWxUserInfo() {
        const res = Taro.getStorageSync('wxUserInfo');
        if (res !== '' && res !== undefined && res !== 'undefined') {
            return res;
        } else {
            return false;
        }
    }
    static setToken(item) {
        return new Promise((resolve, reject) => {
            Taro.setStorage({ key: 'Authorization', data: item })
                .then((res) => {
                    resolve(res);
                })
                .catch(() => {
                    reject({ msg: '储存用户token失败' });
                });
        });
    }
    static getToken() {
        const res = this.checkSignin(false);
        if (res) {
            return res.token;
        } else {
            return false;
        }
    }

}