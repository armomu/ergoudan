import Taro, { Component } from '@tarojs/taro';
import { Provider } from '@tarojs/mobx';
import Index from './pages/index';

import counterStore from './store';
import './custom-variables.scss';

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

const store = {
    counterStore
};

class App extends Component {

    config = {
        pages: [
            'pages/index/index',
        ],
        window: {
            backgroundTextStyle: 'dark',
            navigationBarBackgroundColor: '#fff',
            navigationBarTitleText: 'WeChat',
            navigationStyle: 'custom',
            navigationBarTextStyle: 'black'
        },
        // tabBar: {
        //     backgroundColor: '#fff',
        //     borderStyle: 'white',
        //     selectedColor: '#0A1219',
        //     color: '#B5B8BA',
        //     list: [
        //         {
        //             pagePath: 'pages/index/index',
        //             iconPath: 'assets/icon/icon_pos_def@3x.png',
        //             selectedIconPath: 'assets/icon/icon_pos_cli@3x.png',
        //             text: '位置'
        //         },
        //         {
        //             pagePath: 'pages/scan-code/index',
        //             iconPath: 'assets/icon/icon_code_def@3x.png',
        //             selectedIconPath: 'assets/icon/icon_code_cli@3x.png',
        //             text: '扫码'
        //         },
        //         {
        //             pagePath: 'pages/mine/index',
        //             iconPath: 'assets/icon/icon_my_def@3x.png',
        //             selectedIconPath: 'assets/icon/icon_my_cli@3x.png',
        //             text: '我的'
        //         }
        //     ]
        // },
        permission: {
            'scope.userLocation': {
                desc: '位置信息将用于 *** 信息'
            }
        }
    }

    componentDidMount() {
        // Taro.clearStorage();
    }

    componentDidShow() { }

    componentDidHide() { }

    componentDidCatchError() { }

    // 在 App 类中的 render() 函数没有实际作用
    // 请勿修改此函数
    render() {
        return (
            <Provider store={store}>
                <Index />
            </Provider>
        );
    }
}

Taro.render(<App />, document.getElementById('app'));
